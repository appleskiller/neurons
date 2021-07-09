import { Binding, Property, Element, Emitter } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IBindingRef, IChangeDetector } from '../../binding/common/interfaces';
import { ISelectionChangeEvent, IItemStateStatic, IItemState, IItemClickEvent, IMultiSelectionChangeEvent } from '../interfaces';
import { bind } from '../../binding';
import { DropDownList } from '../dropdown/dropdown';
import { CheckBoxGroup } from '../checkbox/checkboxgroup';
import { popupManager } from '../../cdk/popup/manager';
import { RadioGroup } from '../radio/radiogroup';
import { List, DefaultItemState, defaultLabelFunction } from './list';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { ellipsis_h } from '../icon/icons';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { theme } from '../style/theme';

@Binding({
    selector: 'ne-collapsible-item-wrapper',
    template: `
        <div #container [class.ne-collapsible-list-item]="true"
            [class.selected]="selected"
            (click)="onItemClick($event)"
        ></div>
    `
})
export class ItemRendererWrapper<T> {
    @Property() item: T = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() params: any;

    @Element('container') container: HTMLElement;
    @Emitter() itemClick: IEmitter<{item: T, index: number, causeEvent: MouseEvent}>;

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
    selector: 'ne-collapsible-list',
    template: `
        <div #container [class]="{'ne-collapsible-list': true, 'enable-selection': enableSelection}">
            <div #content class="ne-collapsible-list-content"></div>
            <div [class]="{'empty-info': true, 'show': !dataProvider || !dataProvider.length}">无内容</div>
        </div>
    `,
    style: `
        .ne-collapsible-list {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .ne-collapsible-list .empty-info {
            display: none;
            text-align: center;
            color: rgba(125, 125, 125, 0.24);
            font-style: italic;
            user-select: none;
        }
        .ne-collapsible-list .empty-info.show {
            display: block;
        }
        .ne-collapsible-list .ne-collapsible-list-content {
            
        }
        .ne-collapsible-list.enable-selection .ne-collapsible-list-item {
            cursor: pointer;
            transition: ${theme.transition.normal('background-color', 'color')};
            display: inline-block;
            vertical-align: top;
            min-width: 24px;
            text-align: center;
            margin-bottom: 2px;
        }
        .ne-collapsible-list.enable-selection .ne-collapsible-list-item:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
        .ne-collapsible-list .ne-collapsible-list-more {
            cursor: pointer;
            display: inline-block;
            vertical-align: top;
            min-width: 24px;
            text-align: center;
            padding: 0 4px;
        }
        .ne-collapsible-list.enable-selection .ne-collapsible-list-item.selected {
            
        }
        .ne-collapsible-list-more-popup .ne-popup-panel-content {
            padding: 4px 0;
        }
        .ne-collapsible-list-more-popup .ne-popup-panel-content .ne-list .ne-check-item .ne-check-item-icon > .ne-icon {
            transition: none;
        }
        .ne-collapsible-list-more-popup .ne-list-item.selected {
            
        }
    `,
    requirements: [
        DefaultItemState,
        DropDownList
    ]
})
export class CollapsibleList<T> {
    @Property() active = true;
    @Property() enableSelection = true;
    @Property() enableMultiSelection = false;
    @Property() listStyle: 'single-line' | 'multi-line' = 'single-line';
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() selectedItems: T[] = [];
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() itemRendererParams: any;

    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;
    @Emitter('item_click') itemClick: IEmitter<IItemClickEvent<T>>;

    @Element('shim') shim: HTMLElement;
    @Element('container') container: HTMLElement;
    @Element('content') content: HTMLElement;

    moreDataProvider: T[] = [];
    itemRefs: IBindingRef<any>[] = [];
    moreRef: IBindingRef<any>;
    popupRef: IPopupRef<any>;

    onChanges(changes: StateChanges) {
        if (!changes
            || 'dataProvider' in changes
            || 'itemRenderer' in changes
            || 'itemRendererParams' in changes
            || 'listStyle' in changes
            || 'selectedItem' in changes
            || 'selectedItems' in changes
            || 'active' in changes
        ) {
            // 重新测量
            this._reset();
        }
    }
    onDestroy() {
        this.popupRef && this.popupRef.close();
        this.itemRefs.forEach(ref => ref.destroy());
        this.moreRef && this.moreRef.destroy();
    }
    onResize() {
        this._reset();
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
            const oldIndex = this.dataProvider.indexOf(oldSelectedItem);
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
        const ref = bind(ItemRendererWrapper, {
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
    private _reset() {
        if (!this.active) return;
        if (this.dataProvider.length){
            this._calcCollapsible();
        } else {
            if (this.moreDataProvider.length) {
                this.moreDataProvider = [];
            }
        }
        // 清理ref
        const len = (this.dataProvider || []).length;
        for (var i: number = this.itemRefs.length - 1; i >=len ; i--) {
            this.itemRefs[i].destroy();
            this.itemRefs.splice(i, 1);
        }
        this.popupRef && this.popupRef.panel.changeState({
            state: this._createMoreState()
        })
    }
    private _sliceDataProvider(dataProvider, startIndex) {
        this.moreDataProvider = [];
        if (dataProvider.length) {
            for (let i = startIndex; i < dataProvider.length; i++) {
                this.moreDataProvider.push(dataProvider[i]);
                const ref = this.itemRefs[i];
                ref && ref.detach();
            }
        }
    }
    
    private _calcCollapsible() {
        // more
        if (!this.moreRef) {
            this.moreRef = this._createMoreButton();
        } else {
            this.moreRef.attach();
        }
        const moreSize = this.moreRef.getBoundingClientRect();
        const moreWidth = moreSize.width;
        this.moreRef.detach();
        // list
        let totalWidth = 0, totalHeight = 0,
            rowCount = 1, startIndex = -1,
            typicalHeight = undefined,
            currentY = undefined, currentWidth = 0, previousWidth = 0;
        let containerSize = this.container.getBoundingClientRect();
        let remainHeight = 0;
        for (var i: number = 0; i < this.dataProvider.length; i++) {
            let ref = this.itemRefs[i];
            if (!ref) {
                ref = this.createItemRenderer(this.dataProvider[i], i);
                this.itemRefs.push(ref);
            } else {
                ref.setState(this.wrapItemState(this.dataProvider[i], i));
                ref.appendTo(this.content);
            }
            const size = ref.getBoundingClientRect();
            if (typicalHeight === undefined) {
                typicalHeight = size.height;
            }
            if (currentY === undefined) {
                currentY = size.top;
            }
            if (size.top === currentY) {
                currentWidth = currentWidth + size.width;
            } else {
                previousWidth = currentWidth;
                // 已经折行
                currentWidth = size.width;
                currentY = size.top;
                rowCount += 1;
            }
            containerSize = this.container.getBoundingClientRect();
            totalWidth = Math.max(totalWidth, currentWidth);
            totalHeight = currentY + typicalHeight - containerSize.top;
            startIndex = i;
            if (rowCount > 1) {
                if (totalHeight > containerSize.height) {
                    startIndex = (previousWidth + moreWidth <= containerSize.width) ? Math.max(startIndex - 1, -1) : Math.max(startIndex - 2, -1);
                    totalHeight = currentY - containerSize.top;
                    remainHeight = containerSize.height - totalHeight;
                    break;
                }
                if (this.listStyle === 'single-line') {
                    startIndex = (previousWidth + moreWidth <= containerSize.width) ? Math.max(startIndex - 1, -1) : Math.max(startIndex - 2, -1);
                    totalHeight = currentY - containerSize.top;
                    remainHeight = containerSize.height - totalHeight;
                    break;
                }
            }
        }
        this._sliceDataProvider(this.dataProvider, startIndex + 1);
        // more
        if (this.moreDataProvider.length) {
            this.moreRef.appendTo(this.content);
        }
    }
    private _createMoreButton() {
        return bind(`
            <div #trigger class="ne-collapsible-list-more" title="更多..." (click)="onClick(trigger)">
                <ne-icon [icon]="icon"/>
            </div>
        `, {
            container: this.content,
            state: {
                icon: ellipsis_h,
                onClick: (trigger) => {
                    this._showMore(trigger);
                }
            }
        });
    }
    private _showMore(trigger) {
        this.popupRef && this.popupRef.close();
        let popupRef: IPopupRef<List<any>>;
        const state = this._createMoreState();
        state['onSelectedItemChange'] = (item) => {
            if (!state.enableMultiSelection) {
                this.applySingleSelection(item, this.dataProvider.indexOf(item));
                popupRef && popupRef.close();
            }
        }
        state['onSelectedItemsChange'] = (items) => {
            if (state.enableMultiSelection) {
                const oldSelectedItems = (this.selectedItems || []).concat();
                this.selectedItems = items;
                this.selectedItemsChange.emit(this.selectedItems);
                this.multiSelectionChange.emit({
                    selectedItems: this.selectedItems,
                    dataProvider: this.dataProvider,
                    oldSelectedItems: oldSelectedItems
                });
                state.selectedItems = this.selectedItems;
            }
        }
        popupRef = popupManager.open(List, {
            panelClass: 'ne-collapsible-list-more-popup',
            connectElement: trigger,
            popupMode: 'dropdown',
            position: 'bottomRight',
            width: 240,
            binding: {
                '[active]': 'active',
                '[enableSelection]': 'enableSelection',
                '[enableMultiSelection]': 'enableMultiSelection',
                '[dataProvider]': 'dataProvider',
                '[(selectedItem)]': 'selectedItem',
                '[(selectedItems)]': 'selectedItems',
                '[labelField]': 'labelField',
                '[labelFunction]': 'labelFunction',
                '[itemRenderer]': 'itemRenderer',
                '(selectedItemChange)': 'onSelectedItemChange($event)',
                '(selectedItemsChange)': 'onSelectedItemsChange($event)',
            },
            state: state
        });
        popupRef.onClose.listen(() => {
            if (this.popupRef !== popupRef) return;
            this.popupRef = null;
        });
        this.popupRef = popupRef;
    }
    private _createMoreState() {
        return {
            'active': this.active,
            'enableSelection': this.enableSelection,
            'enableMultiSelection': this.enableMultiSelection,
            'dataProvider': this.moreDataProvider,
            'selectedItem': this.selectedItem,
            'selectedItems': this.selectedItems,
            'labelField': this.labelField,
            'labelFunction': (item: T) => this.labelFunction(item),
            'itemRenderer': this.itemRenderer,
            'itemRendererParams': this.itemRendererParams,
        }
    }
}

