import { getMaxHeight } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { IChangeDetector, IBindingRef, StateChanges } from '../../binding/common/interfaces';
import { bind } from '../../binding';
import { Element, Property, Binding, Emitter, Inject } from '../../binding/factory/decorator';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IItemClickEvent, IItemStateStatic, IMultiSelectionChangeEvent, ISelectionChangeEvent } from '../interfaces';
import { DefaultItemState, defaultLabelFunction } from './list';
import { isDefined, findAValidValue } from 'neurons-utils';
import { ISVGIcon } from 'neurons-dom/dom/element';

@Binding({
    selector: 'ne-tile-item-wrapper',
    template: `
        <div #container [class.ne-tile-list-item]="true"
            [class.selected]="selected"
            (click)="onItemClick($event)"
        ></div>
    `
})
export class TileItemRendererWrapper<T> {
    @Property() item: T = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() params: any;

    @Element('container') container: HTMLElement;
    @Emitter() itemClick: IEmitter<{ item: T, index: number, causeEvent: MouseEvent }>;

    private _ref: IBindingRef<any>;
    private _oldSize;

    onChanges(changes) {
        let skipUpdate = false;
        if (!changes || 'itemRenderer' in changes) {
            this._ref && this._ref.destroy();
            this._ref = bind((this.itemRenderer || DefaultItemState), {
                container: this.container,
                hostBinding: {
                    '[item]': 'item',
                    '[itemIndex]': 'itemIndex',
                    '[label]': 'label',
                    '[selected]': 'selected',
                    '[params]': 'params',
                },
                state: {
                    item: this.item,
                    itemIndex: this.itemIndex,
                    label: this.label,
                    selected: this.selected,
                    params: this.params,
                }
            });
            this._ref.detectChanges();
            skipUpdate = true;
        }
        if (!skipUpdate && (!changes || 'itemIndex' in changes || 'selected' in changes || 'item' in changes || 'label' in changes || 'params' in changes)) {
            this._ref.setState({
                item: this.item,
                itemIndex: this.itemIndex,
                label: this.label,
                selected: this.selected,
                params: this.params,
            });
        }
    }
    onItemClick(e) {
        this.itemClick.emit({
            causeEvent: e,
            item: this.item,
            index: this.itemIndex
        })
    }
}

@Binding({
    selector: 'ne-tile-list',
    template: `
        <div #container [class]="{'ne-tile-list': true, 'enable-selection': enableSelection}" (scroll)="onScroll($event)">
            <div #shim class="ne-list-shim" [style.height]="contentHeight">
                <div #content class="ne-tile-list-content"></div>
            </div>
            <div [class]="{'empty-info': true, 'show': !dataProvider || !dataProvider.length}">无内容</div>
        </div>
    `,
    style: `
        .ne-tile-list {
            position: relative;
            max-height: 240px;
            overflow: auto;
        }
        .ne-tile-list .ne-tile-list-shim {
            position: relative;
        }
        .ne-tile-list .empty-info {
            display: none;
            text-align: center;
            color: rgba(125, 125, 125, 0.24);
            font-style: italic;
            user-select: none;
        }
        .ne-tile-list .empty-info.show {
            display: block;
        }
        .ne-tile-list .ne-tile-list-content {
            top: 0;
            left: 0;
            right: 0;
            position: absolute;
        }
        .ne-tile-list.enable-selection .ne-tile-list-item {
            cursor: pointer;
            transition: background-color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-tile-list.enable-selection .ne-tile-list-item:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
    `,
    requirements: [
        DefaultItemState,
    ]
})
export class TileList<T> {
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
    @Property() itemRendererParams: any;

    @Property() columnCount: number = 1;

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
    itemRefs: IBindingRef<any>[] = [];

    startIndex: number = 0;
    endIndex: number = 0;
    offset: number = 0;
    contentHeight: number = 0;

    private _typicalHeight = undefined;
    
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
        if (changes && ('dataProvider' in changes || 'filterFunction' in changes || 'columnCount' in changes || 'active' in changes || this._isInvalidTypicalHeight())) {
            this._resetDataProvider();
        }
    }
    onDestroy() {
        this.itemRefs.forEach(ref => ref.destroy());
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
    getItemParams(item: T, index: number) {
        if (!this.itemRendererParams) return null;
        return typeof this.itemRendererParams === 'function' ? this.itemRendererParams.call(null, item, index) : this.itemRendererParams;
    }
    isItemSelected(item: T, index: number) {
        if (this.enableMultiSelection) {
            return this.selectedItems.indexOf(item) !== -1;
        } else {
            return this.selectedItem === item;
        }
    }
    onItemClick(e: MouseEvent, item: T, index: number) {
        if (this.enableMultiSelection) {
            this.applyMultiSelection(item, index);
        } else {
            this.applySingleSelection(item, index);
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
            const oldIndex = this.nativeDataProvider.indexOf(oldSelectedItem);
            if (this.itemRefs[oldIndex]) {
                this.itemRefs[oldIndex].setState({ selected: false });
            }
            if (this.itemRefs[index]) {
                this.itemRefs[index].setState({ selected: true });
            }
        }
    }
    protected applyMultiSelection(item: T, index: number) {
        const ref = this.itemRefs[index];
        const oldSelectedItems = (this.selectedItems || []).concat();
        const itemIndex = this.selectedItems.indexOf(item);
        if (itemIndex === -1) {
            this.selectedItems.push(item);
            ref && ref.setState({ selected: true });
        } else {
            this.selectedItems.splice(itemIndex, 1);
            ref && ref.setState({ selected: false });
        }
        this.selectedItemsChange.emit(this.selectedItems);
        this.multiSelectionChange.emit({
            selectedItems: this.selectedItems,
            dataProvider: this.dataProvider,
            oldSelectedItems: oldSelectedItems
        });
    }
    protected createItemRenderer(item: T, index: number): IBindingRef<any> {
        const state = this.wrapItemState(item, index);
        state['onItemClick'] = (e) => {
            this.onItemClick(e.causeEvent, e.item, e.index);
        };
        const ref = bind(TileItemRendererWrapper, {
            container: this.content,
            hostBinding: {
                '[item]': 'item',
                '[itemIndex]': 'itemIndex',
                '[label]': 'label',
                '[selected]': 'selected',
                '[itemRenderer]': 'itemRenderer',
                '[params]': 'params',
                '(itemClick)': "onItemClick($event)",
                '(sizeChange)': "onItemSizeChange($event)",
            },
            state: state
        });
        return ref;
    }
    protected wrapItemState(item: T, index: number) {
        return {
            'itemRenderer': this.itemRenderer || DefaultItemState,
            'item': item,
            'itemIndex': index,
            'selected': this.isItemSelected(item, index),
            'label': this.getItemLabel(item),
            'params': this.getItemParams(item, index),
        }
    }
    private _resetDataProvider() {
        if (!this.active) return;
        if (this.dataProvider.length) {
            if (this._isInvalidTypicalHeight()) {
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
        // 清理ref
        const len = (this.nativeDataProvider || []).length;
        for (var i: number = this.itemRefs.length - 1; i >= len; i--) {
            this.itemRefs[i].destroy();
            this.itemRefs.splice(i, 1);
        }
    }
    protected sliceDataProvider(dataProvider, startIndex, endIndex) {
        this.nativeDataProvider = [];
        if (dataProvider.length) {
            for (let i = startIndex; i <= endIndex; i++) {
                this.nativeDataProvider.push(dataProvider[i]);
                let ref = this.itemRefs[i - startIndex];
                if (!ref) {
                    ref = this.createItemRenderer(this.dataProvider[i], i);
                    this.itemRefs.push(ref);
                } else {
                    ref.setState(this.wrapItemState(this.dataProvider[i], i));
                    ref.appendTo(this.content);
                }
            }
        }
    }
    private _resetNativeDataProvider() {
        if (!this.active) return;
        // const scrollBarSize = utils.dom.getScrollbarWidth();
        const containerSize = getMaxHeight(this.container);
        const columnCount = this.columnCount <= 0 ? 1 : this.columnCount;
        this.contentHeight = this._typicalHeight * Math.ceil(this.filteredDataProvider.length / columnCount);
        if (this.contentHeight <= 0) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = 0;
        } else if (this.contentHeight <= containerSize) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = this.filteredDataProvider.length - 1;
        } else {
            const maxVisibleItemsCount = (Math.max(1, Math.floor(containerSize / this._typicalHeight)) + 4) * columnCount;
            const scrollTop = this.container.scrollTop;
            let scrollIndex = Math.floor(scrollTop / this._typicalHeight);
            this.endIndex = Math.min(this.filteredDataProvider.length - 1, scrollIndex + maxVisibleItemsCount);
            this.startIndex = this.endIndex - Math.min(maxVisibleItemsCount, this.filteredDataProvider.length - 1);
            this.offset = this.startIndex * this._typicalHeight;
        }
        this.sliceDataProvider(this.filteredDataProvider, this.startIndex, this.endIndex);
    }
    private _measureSize() {
        if (this.content.children.length > 1) {
            const child = this.content.children.item(0);
            const size = child.getBoundingClientRect();
            this._typicalHeight = size.height;
        } else {
            const typicalData = findAValidValue(this.dataProvider);
            const typicalRef = this.createItemRenderer(typicalData, 0);
            const size = typicalRef.getBoundingClientRect();
            this._typicalHeight = size.height;
            typicalRef.destroy();
        }
    }
    private _isInvalidTypicalHeight() {
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

