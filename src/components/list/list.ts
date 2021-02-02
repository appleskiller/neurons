import { Binding, Property, Element, Emitter, Inject } from '../../binding/factory/decorator';
import { getMaxHeight, createElement, removeMe } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector } from '../../binding/common/interfaces';
import { ISelectionChangeEvent, IItemStateStatic, IItemState, IItemClickEvent, IMultiSelectionChangeEvent } from '../interfaces';
import { bind } from '../../binding';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { isDefined, isDate, ObjectAccessor, findAValidValue } from 'neurons-utils';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';

export function defaultLabelFunction(item, labelField): string {
    if (isDefined(item)) {
        if (isDate(item)) {
            return (item as Date).toLocaleString();
        } else if (typeof item === 'object' && labelField) {
            if (labelField.indexOf('.') !== -1) {
                const accessor = new ObjectAccessor(item);
                const v = accessor.get(labelField);
                if (v === ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                    return '';
                } else {
                    return isDefined(v) ? v : '';
                }
            } else {
                return item[labelField];
            }
        } else {
            return item;
        }
    }
    return '';
}

@Binding({
    selector: 'ne-default-item-state',
    template: `<div class="ne-list-item-inffix" [title]="label">{{label}}</div>`,
    style: `
        .ne-list-item-inffix {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
    `
})
export class DefaultItemState<T> implements IItemState<T> {
    @Property() item: T = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
    @Property() params: any;
}

@Binding({
    selector: 'ne-list',
    template: `
        <div #container [class]="{'ne-list': true, 'enable-selection': enableSelection}" (scroll)="onScroll($event)">
            <div #shim class="ne-list-shim" [style.height]="contentHeight">
                <div #content class="ne-list-content" [style.top]="offset">
                    <div [class.ne-list-item]="true"
                        *for="item in nativeDataProvider" let-index="$index"
                        [class.selected]="isItemSelected(item, startIndex + index)"
                        (click)="onItemClick($event, item, startIndex + index)"
                        (mousedown)="onItemMousedown($event, item, startIndex + index)"
                    >
                        <ne-binding
                            [source]="itemRenderer"
                            [hostBinding]="itemRendererBinding"
                            [state]="{'item': item, 'itemIndex': startIndex + index, 'selected': isItemSelected(item, startIndex + index), 'label': getItemLabel(item), 'params': getItemParams(item, startIndex + index)}"
                        />
                    </div>
                </div>
            </div>
            <div [class]="{'empty-info': true, 'show': !dataProvider || !dataProvider.length}">无内容</div>
        </div>
    `,
    style: `
        .ne-list {
            max-height: 240px;
            overflow: auto;
        }
        .ne-list .ne-list-shim {
            position: relative;
        }
        .ne-list .empty-info {
            display: none;
            text-align: center;
            color: rgba(125, 125, 125, 0.24);
            font-style: italic;
            user-select: none;
        }
        .ne-list .empty-info.show {
            display: block;
        }
        .ne-list .ne-list-content {
            top: 0;
            left: 0;
            right: 0;
            position: absolute;
        }
        .ne-list.enable-selection .ne-list-item {
            cursor: pointer;
            transition: ${theme.transition.normal('background-color', 'color')};
        }
        .ne-list.enable-selection .ne-list-item:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
    `,
    requirements: [
        DefaultItemState,
    ]
})
export class List<T> {
    @Property() active = true;
    @Property() enableSelection = true;
    @Property() enableMultiSelection = false;
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() selectedItems: T[] = [];
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() filterFunction: (item: T) => boolean;
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() itemRendererBinding = {
        '[item]': 'item',
        '[itemIndex]': 'itemIndex',
        '[label]': 'label',
        '[selected]': 'selected',
        '[params]': 'params',
    }
    @Property() itemRendererParams: any;

    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;
    @Emitter('item_click') itemClick: IEmitter<IItemClickEvent<T>>;
    @Emitter('item_mousedown') itemMouseDown: IEmitter<IItemClickEvent<T>>;

    @Element('shim') shim: HTMLElement;
    @Element('container') container: HTMLElement;
    @Element('content') content: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) protected cdr: IChangeDetector;

    filteredDataProvider: T[] = [];
    nativeDataProvider: T[] = [];
    startIndex: number = 0;
    endIndex: number = 0;
    offset: number = 0;
    contentHeight: number | string = 0;

    protected _typicalHeight = undefined;

    onInit() {
        this.dataProvider = this.dataProvider || [];
        this._resetDataProvider();
    }
    onChanges(changes: StateChanges) {
        if (changes && 'dataProvider' in changes) {
            this.dataProvider = this.dataProvider || [];
        }
        if (changes && 'itemRenderer' in changes) {
            // 重新测量
            this._typicalHeight = undefined;
        }
        if (changes && ('dataProvider' in changes || 'filterFunction' in changes || 'active' in changes || this._isInvalidTypicalSize())) {
            this._resetDataProvider();
        }
    }
    onResize() {
        this._resetNativeDataProvider();
    }
    onScroll(e) {
        this._resetNativeDataProvider();
    }
    getItemLabel(item: T) {
        if (this.labelFunction) return this.labelFunction(item);
        return defaultLabelFunction(item, this.labelField);
    }
    isItemSelected(item: T, index: number) {
        if (this.enableMultiSelection) {
            return this.selectedItems.indexOf(item) !== -1;
        } else {
            return this.selectedItem === item;
        }
    }
    getItemParams(item: T, index: number) {
        if (!this.itemRendererParams) return null;
        return typeof this.itemRendererParams === 'function' ? this.itemRendererParams.call(null, item, index) : this.itemRendererParams;
    }
    onItemClick(e: MouseEvent, item: T, index: number) {
        if (!e.defaultPrevented) {
            if (this.enableMultiSelection) {
                this.applyMultiSelection(item, index);
            } else {
                this.applySingleSelection(item, index);
            }
        }
        this.itemClick.emit({
            item: item,
            index: index,
            dataProvider: this.dataProvider,
            element: e.currentTarget as HTMLElement,
            causeEvent: e
        });
    }
    onItemMousedown(e: MouseEvent, item: T, index: number) {
        this.itemMouseDown.emit({
            item: item,
            index: index,
            dataProvider: this.dataProvider,
            element: e.currentTarget as HTMLElement,
            causeEvent: e
        })
    }
    protected applySingleSelection(item: T, index: number) {
        const oldSelectedItem = this.selectedItem;
        if (this.selectedItem !== item) {
            this.selectedItem = item;
            this.selectedItemChange.emit(this.selectedItem);
            this.selectionChange.emit({
                selectedItem: this.selectedItem,
                dataProvider: this.dataProvider,
                oldSelectedItem: oldSelectedItem
            });
        }
    }
    protected applyMultiSelection(item: T, index: number) {
        const oldSelectedItems = (this.selectedItems || []).concat();
        const itemIndex = this.selectedItems.indexOf(item);
        if (itemIndex === -1) {
            this.selectedItems.push(item);
        } else {
            this.selectedItems.splice(itemIndex, 1);
        }
        this.selectedItemsChange.emit(this.selectedItems);
        this.multiSelectionChange.emit({
            selectedItems: this.selectedItems,
            dataProvider: this.dataProvider,
            oldSelectedItems: oldSelectedItems
        });
    }
    protected sliceDataProvider(dataProvider, startIndex, endIndex) {
        this.nativeDataProvider = [];
        if (dataProvider.length) {
            for (let i = startIndex; i <= endIndex; i++) {
                this.nativeDataProvider.push(dataProvider[i]);
            }
        }
    }
    protected _resetDataProvider() {
        if (!this.active) return;
        if (this.dataProvider.length){
            if (this._isInvalidTypicalSize()) {
                this._measureSize();
            }
            // 过滤
            if (this.filterFunction) {
                this.filteredDataProvider = (this.dataProvider || []).filter(item => this.filterFunction(item));
            } else {
                this.filteredDataProvider = this.dataProvider;
            }
            this._resetNativeDataProvider();
        } else {
            if (this.nativeDataProvider.length) {
                this.nativeDataProvider = [];
            }
            this.contentHeight = 0;
        }
    }
    protected _resetNativeDataProvider() {
        if (!this.active) return;
        // const scrollBarSize = utils.dom.getScrollbarWidth();
        const containerSize = getMaxHeight(this.container);
        this.contentHeight = this._typicalHeight * this.filteredDataProvider.length;
        if (this.contentHeight <= 0) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = 0;
        } else if (this.contentHeight <= containerSize) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = this.filteredDataProvider.length - 1;
        } else {
            const itemsPerCol = Math.max(1, Math.floor(containerSize / this._typicalHeight)) + 4;
            const scrollTop = this.container.scrollTop;
            let scrollIndex = Math.floor(scrollTop / this._typicalHeight);
            this.endIndex = Math.min(this.filteredDataProvider.length - 1, scrollIndex + itemsPerCol);
            this.startIndex = this.endIndex - Math.min(itemsPerCol, this.filteredDataProvider.length - 1);
            this.offset = this.startIndex * this._typicalHeight;
        }
        this.sliceDataProvider(this.filteredDataProvider, this.startIndex, this.endIndex);
    }
    protected _measureSize() {
        if (this.content.children.length > 1) {
            const child = this.content.children.item(0);
            const size = child.getBoundingClientRect();
            this._typicalHeight = Math.ceil(size.height);
        } else {
            const typicalData = findAValidValue(this.dataProvider);
            const container = createElement('div', 'ne-list-item');
            this.content.appendChild(container);
            const getItemLabel = () => {
                const label = this.getItemLabel(typicalData);
                return isDefined(label) ? label : '国';
            }
            const typicalRef = bind((this.itemRenderer || DefaultItemState), {
                container: container,
                hostBinding: this.itemRendererBinding,
                state: {
                    'item': typicalData,
                    'itemIndex': 0,
                    'selected': this.isItemSelected(typicalData, 0),
                    'label': getItemLabel(),
                }
            })
            const size = container.getBoundingClientRect();
            this._typicalHeight = Math.ceil(size.height);
            typicalRef.destroy();
            removeMe(container);
        }
    }
    protected _isInvalidTypicalSize() {
        if (this._typicalHeight === 0 || !isDefined(this._typicalHeight) || isNaN(this._typicalHeight)) {
            return true;
        } else {
            if (this.content.children.length > 1) {
                const child = this.content.children.item(0);
                const size = child.getBoundingClientRect();
                if (size.height && size.height !== this._typicalHeight) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
    }
}





