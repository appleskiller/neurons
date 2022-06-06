
import { Binding, Property, Element, Emitter, Inject } from '../../binding/factory/decorator';
import { getMaxHeight, createElement, removeMe } from 'neurons-dom';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector, IBindingRef, IElementRef } from '../../binding/common/interfaces';
import { ISelectionChangeEvent, IItemStateStatic, IItemState, IItemClickEvent, IMultiSelectionChangeEvent } from '../interfaces';
import { bind } from '../../binding';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { isDefined, isDate, ObjectAccessor, findAValidValue, Map, moveItemTo, isEmpty, isArray } from 'neurons-utils';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { SvgIcon } from '../icon/svgicon';
import { List, defaultLabelFunction } from '../list/list';
import { arrow_left, arrow_right } from '../icon/icons';
import { IInjector } from 'neurons-injector';

class TreeDataItem {
    constructor(
        public data: any,
        public index: number,
        public depth: number,
        public label: string,
        public selected: boolean,
        public isLeaf: boolean,
        public expanded: boolean,
        private _treeDataProvider: TreeDataProvider,
    ) {
    }
    expand() {
        this._treeDataProvider.expand(this.data);
    }
    collapse() {
        this._treeDataProvider.collapse(this.data);
    }
}

export interface ITreeDataProviderOption {
    childrenField?: string;
    childrenFunction?: (item) => any[];
    labelField?: string;
    labelFunction?: (item) => string;
}

class TreeDataProvider {
    constructor(
        private source: any[],
        private _selectedDatas: any[],
        private _option?: ITreeDataProviderOption,
    ) {
        this._option = {
            ...(this._option || {})
        };
        this._selectedDatas = this._selectedDatas || [];
        this.flatCollection = this._createCollection(source);
        // 更新selectedItem
        this._updateSelection();
    }
    private _nativeEmitter = new EventEmitter();

    updated: IEmitter<void> = emitter('updated', this._nativeEmitter);

    flatCollection: TreeDataItem[] = [];
    selectedItems: TreeDataItem[] = [];

    private _itemMap = new Map<any, TreeDataItem>();
    private _childrenMap = new Map<TreeDataItem, TreeDataItem[]>();
    private _parentMap = new Map<TreeDataItem, TreeDataItem>();

    setSource(source: any[]) {
        this.source = source;
        this.refresh();
    }
    setSelectedDatas(datas: any[], autoExpand = false) {
        const selectedDatas = datas || [];
        const old = (this._selectedDatas || []).concat();
        this._selectedDatas = selectedDatas;
        this._selectedDatas.forEach(data => {
            const item = this._itemMap.get(data);
            item && (item.selected = true);
            const index = old.indexOf(data);
            index !== -1 && old.splice(index, 1);
        });
        old.forEach(data => {
            const item = this._itemMap.get(data);
            item && (item.selected = false);
        });
        // TODO 暂时不支持展开到集合所有元素
        autoExpand && this._expandTo(this._selectedDatas[0]);
        // 更新selectedItem
        this._updateSelection();
        this.updated.emit();
    }
    setOption(option: ITreeDataProviderOption) {
        if (!option || isEmpty(option)) return;
        Object.assign(this._option, option);
        if ('childrenField' in option || 'childrenFunction' in option) {
            this.refresh();
        } else if ('labelField' in option || 'labelFunction' in option) {
            this._itemMap.forEach((data, item) => {
                item.label = this._getLabel(data);
            });
            this.updated.emit();
        }
    }
    refresh() {
        const source = this.source || [];
        const token = {index: 0};
        source.forEach((data, i) => {
            this._refreshItem(null, data, token, 0);
        });
        for (let i = this.flatCollection.length - 1; i >= token.index; i--) {
            const item = this.flatCollection.pop();
            this._removeItem(item);
        }
        // 更新selectedItem
        this._updateSelection();
        this.updated.emit();
    }
    expand(data) {
        const item = this._itemMap.get(data);
        if (item && !item.isLeaf && !item.expanded) {
            item.expanded = true;
            const items = this._expandItem(item);
            if (items.length) {
                const params = [item.index + 1, 0].concat(items);
                this.flatCollection.splice.apply(this.flatCollection, params);
                for (let i = item.index + 1; i < this.flatCollection.length; i++) {
                    this.flatCollection[i].index = i;
                }
            }
        }
        // 更新selectedItem
        this._updateSelection();
        this.updated.emit();
    }
    // 展开到某个节点
    expandTo(data: any) {
        if (!data) return;
        this._expandTo(data);
        this._updateSelection();
        this.updated.emit();
    }
    collapse(data) {
        const item = this._itemMap.get(data);
        if (item && !item.isLeaf && item.expanded) {
            const items = this._collapseItem(item);
            item.expanded = false;
            if (items && items.length) {
                for (let i = item.index + 1; i < this.flatCollection.length; i++) {
                    this.flatCollection[i].index = i;
                }
            }
        }
        this.updated.emit();
    }
    destroy() {
        this._nativeEmitter.off();
    }
    getItemParent(item: TreeDataItem): TreeDataItem {
        return this._parentMap.get(item);
    }
    getItemParentStack(item: TreeDataItem): TreeDataItem[] {
        return this._findItemParentStack(item, [item]);
    }
    private _expandTo(data: any) {
        if (!data) return;
        const dataStack = this._findDataStack(this.source, d => data === d);
        if (!dataStack || !dataStack.length) return;
        const stack = dataStack[0];
        if (!stack || !stack.length) return;
        
        const _recurseItemChildren = (item) => {
            if (item && !item.isLeaf && item.expanded) {
                this._recurseSource(this._childrenMap.get(item), childItem => {
                    childItem.index = this.flatCollection.length;
                    this.flatCollection.push(childItem);
                    if (childItem && !childItem.isLeaf && childItem.expanded) {
                        return this._childrenMap.get(childItem);
                    }
                    return null;
                });
            }
        }

        this.flatCollection.length = 0;
        let item: TreeDataItem;
        this._recurseSource(this.source, d => {
            item = this._itemMap.get(d);
            // 如果存在
            if (item) {
                item.index = this.flatCollection.length;
                this.flatCollection.push(item);
            }
            if (!stack.length) {
                _recurseItemChildren(item);
            } else {
                if (!item) {
                    const parentItem = this._parentMap.get(d);
                    const depth = parentItem ? parentItem.depth + 1 : 0
                    item = this._createItem(parentItem, d, this.flatCollection.length, depth);
                    this.flatCollection.push(item);
                }
                if (d === stack[0]) {
                    stack.shift();
                    item.expanded = true;
                    this._expandItem(item);
                    return this._getChildren(d);
                } else {
                    _recurseItemChildren(item);
                }
            }
            return null;
        });
    }
    private _findItemParentStack(item: TreeDataItem, stack: TreeDataItem[]): TreeDataItem[] {
        stack = stack || [];
        const parent = this._parentMap.get(item);
        if (parent) {
            stack.unshift(parent);
            this._findItemParentStack(parent, stack);
        }
        return stack;
    }
    private _updateSelection() {
        // 更新selectedItem
        this.selectedItems = (this._selectedDatas || []).map(data => this._itemMap.get(data)).filter(item => !!item);
    }
    private _expandItem(item: TreeDataItem) {
        let result = [];
        if (item && !item.isLeaf && item.expanded) {
            const childItems = this._childrenMap.get(item);
            if (!childItems) {
                this._childrenMap.set(item, result);
                (this._getChildren(item.data) || []).forEach(data => {
                    const childItem = this._createItem(item, data, item.index + 1 + result.length, item.depth + 1);
                    result.push(childItem);
                });
            } else {
                result = this._collectVisibleChildren(item, result);
            }
        }
        return result;
    }
    private _collapseItem(item: TreeDataItem) {
        const items = this._collectVisibleChildren(item);
        if (!items.length) return [];
        return this.flatCollection.splice(item.index + 1, items.length);
    }
    private _collectVisibleChildren(item: TreeDataItem, result = []): TreeDataItem[] {
        if (item && !item.isLeaf && item.expanded) {
            let childItems = this._childrenMap.get(item);
            if (childItems) {
                childItems.forEach(child => {
                    result.push(child);
                    this._collectVisibleChildren(child, result);
                })
            }
        }
        return result;
    }
    private _refreshItem(parent: TreeDataItem, data, token: {index: number}, depth: number) {
        let item = this._itemMap.get(data);
        const children = this._getChildren(data);
        if (item) {
            item.data = data;
            item.index = token.index;
            item.isLeaf = !children;
            item.label = this._getLabel(data);
            item.selected = this._selectedDatas ? this._selectedDatas.indexOf(data) !== -1 : false;
            item.depth = depth;
            // collection
            moveItemTo(this.flatCollection, item, item.index);
        } else {
            item = this._createItem(parent, data, token.index, depth);
            // collection
            this.flatCollection.splice(item.index, 0, item);
        }
        // index
        token.index += 1;
        // parent
        const oldParent = this._parentMap.get(item);
        if (oldParent !== parent) {
            this._parentMap.set(item, parent);
            const parentChildItems = this._childrenMap.get(oldParent);
            if (parentChildItems) {
                const ind = parentChildItems.indexOf(item)
                ind !== -1 && parentChildItems.splice(ind, 1);
            }
        }
        // children
        if (!item.isLeaf && item.expanded && children) {
            const childItems = [];
            this._childrenMap.set(item, childItems);
            children.forEach(d => {
                childItems.push(this._refreshItem(item, d, token, depth + 1));
            });
        }
        return item;
    }
    private _removeItem(item: TreeDataItem) {
        if (!item) return;
        // item map
        this._itemMap.del(item.data);
        // parent map
        const parent = this._parentMap.get(item);
        this._parentMap.del(item);
        if (parent) {
            const parentChildItems = this._childrenMap.get(parent);
            if (parentChildItems) {
                const ind = parentChildItems.indexOf(item)
                ind !== -1 && parentChildItems.splice(ind, 1);
            }
        }
        // children map
        this._childrenMap.del(item);
        // selections
        let index = this._selectedDatas.indexOf(item.data);
        index !== -1 && this._selectedDatas.splice(index, 1);
        index = this.selectedItems.indexOf(item);
        index !== -1 && this.selectedItems.splice(index, 1);
    }
    private _createItem(parent: TreeDataItem, data, index: number, depth: number) {
        const children = this._getChildren(data);
        const isleaf = !children;
        const selected = this._selectedDatas ? this._selectedDatas.indexOf(data) !== -1 : false;
        const item = new TreeDataItem(data, index, depth, this._getLabel(data), selected, isleaf, false, this);
        this._parentMap.set(item, parent);
        this._itemMap.set(data, item);
        return item;
    }
    private _createCollection(source: any[]) {
        return (source || []).map((data, index) => {
            return this._createItem(null, data, index, 0);
        });
    }
    private _recurseSource(source: any[], fn: (data: any, depth: number) => any[], depth = 0) {
        if (!source) return;
        source.forEach(data => {
            const children = fn(data, depth);
            if (children && children.length) {
                this._recurseSource(children, fn, depth + 1);
            }
            depth += 1;
        });
    }
    private _findDataStack(source: any[], fn: (d) => boolean): any[] {
        if (!fn || !source || !source.length) return [];
        const stack = [];
        source.forEach(d => {
            if (fn(d)) {
                // 如果命中
                stack.push([d]);
            } else {
                const children = this._getChildren(d);
                if (children && children.length) {
                    const s = this._findDataStack(children, fn);
                    if (s.length) {
                        s.forEach(r => {
                            r.length && stack.push([d].concat(r));
                        })
                    }
                }
            }
        })
        return stack;
    }
    private _getChildren(data): any[] {
        if (!data) return null;
        if (this._option.childrenFunction) return this._option.childrenFunction(data);
        const childrenField = this._option.childrenField || 'children';
        if (childrenField in data) {
            return data[childrenField];
        } else {
            return null;
        }
    }
    private _getLabel(data) {
        if (this._option.labelFunction) return this._option.labelFunction(data);
        return defaultLabelFunction(data, this._option.labelField);
    }
}

export interface ITreeSelectionChangeEvent<T> {
    selectedItem: T[];
    dataProvider: T[];
    oldSelectedItem: T[];
}

export interface ITreeMultiSelectionChangeEvent<T> {
    selectedItems: T[][];
    dataProvider: T[];
    oldSelectedItems: T[][];
}

export interface ITreeItemClickEvent<T> {
    item: T;
    treeItem: TreeDataItem;
    itemStack: T[];
    index: number;
    dataProvider: T[];
    element: HTMLElement;
    causeEvent: MouseEvent;
}

@Binding({
    selector: 'ne-tree-item-renderer-wrapper',
    template: `
        <div class="ne-tree-item-renderer-wrapper"
            [class.opened]="opened"
            [class.leaf-node]="isLeaf"
            [style.padding-left]="paddingLeft"
            [depth]="depth"
            [title]="label"
            (click)="onClick($event)"
        >
            <ne-icon [icon]="icon" [style.left]="paddingLeft" (click)="onClickIcon($event)"></ne-icon>
            <div class="ne-tree-item-renderer-inffix"
                #content
            >{{label}}</div>
        </div>
    `,
    style: `
        .ne-tree-item-renderer-wrapper {
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
            line-height: 32px;
            user-select: none;
            & > .ne-icon {
                display: inline-block;
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 32px;
                z-index: 1;
                transition: ${theme.transition.normal('transform')};
            }
            &.opened {
                & > .ne-icon {
                    transform: rotateZ(90deg);
                }
            }
            &.leaf-node {
                & > .ne-icon {
                    visibility: hidden;
                }
            }
            .ne-tree-item-renderer-inffix {
                padding-left: 32px;
                box-sizing: border-box;
                position: relative;
            }
        }
    `
})
export class DefaultTreeItemRendererWrapper {
    @Property() item: TreeDataItem;
    @Property() params: any;
    
    @Element('content') content: HTMLElement;
    
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;
    @Inject(BINDING_TOKENS.INJECTOR) injector: IInjector;
    
    depth = 0;
    opened = false;
    isLeaf: boolean = false;
    icon = arrow_right;
    ref: IBindingRef<any>;
    label = '';
    // isLeaf = false;
    paddingLeft = 0;

    private _listeners = [];

    onInit() {
        const updated: IEmitter<void> = this.injector.get('tree_data_updated');
        updated && this._listeners.push(updated.listen(() => {
            this.updateDisplay();
            this.cdr.detectChanges();
        }))
    }

    onChanges(changes) {
        if (!changes || 'item' in changes || 'params' in changes) {
            this.updateDisplay();
        }
        
    }
    onDestroy() {
        this.ref && this.ref.destroy();
        this._listeners.forEach(fn => fn());
        this._listeners = [];
    }
    onClickIcon(e: MouseEvent) {
        e.preventDefault();
        if (this.item) {
            this.item.expanded ? this.item.collapse() : this.item.expand();
            this.opened = this.item.expanded;
        }
    }
    onClick(e: MouseEvent) {
        if (e.defaultPrevented) return;
        if (this.params && this.params.onlyLeafSelection && this.item && !this.item.isLeaf) {
            e.preventDefault();
        }
        if (this.item) {
            this.item.expanded ? this.item.collapse() : this.item.expand();
            this.opened = this.item.expanded;
        }
    }
    protected updateDisplay() {
        if (this.params && this.params.itemRenderer) {
            this.label = '';
            const state = {
                'item': this.item.data,
                'itemIndex': this.item.index,
                'label': this.item.label,
                'selected': this.item.selected,
                'params': this.params.itemRendererParams,
            }
            if (!this.ref) {
                this.ref = bind(this.params.itemRenderer, {
                    container: this.content,
                    hostBinding: {
                        '[item]': 'item',
                        '[itemIndex]': 'itemIndex',
                        '[label]': 'label',
                        '[selected]': 'selected',
                        '[params]': 'params',
                    },
                    state: state,
                    parentInjector: this.injector,
                })
            } else {
                this.ref.setState(state);
            }
        } else {
            this.ref && this.ref.destroy();
            this.label = this.item ? this.item.label : '';
        }
        this.depth = this.item ? this.item.depth : 0;
        this.opened = this.item ? this.item.expanded : false;
        this.isLeaf = this.item ? this.item.isLeaf : false;
        const indentSize = this.params && isDefined(this.params.indentSize) ? this.params.indentSize : 16;
        this.paddingLeft = this.item ? this.item.depth * indentSize : 0;
    }
}

@Binding({
    selector: 'ne-tree',
    template: `
        <ne-list
            #list
            class="ne-tree"
            [class.only-leaf-selection]="onlyLeafSelection"
            [active]="active"
            [enableSelection]="enableSelection"
            [enableMultiSelection]="enableMultiSelection"
            [dataProvider]="flatDataProvider"
            [itemRenderer]="itemWrapperRenderer"
            [itemRendererBinding]="itemWrapperRendererBinding"
            [itemRendererParams]="itemWrapperRendererParams"
            [selectedItem]="selectedTreeItem"
            (selectedItem)="onSelectedItemChange($event)"
            [selectedItems]="selectedTreeItems"
            (selectedItems)="onSelectedItemsChange($event)"
            (selectionChange)="onSelectionChange($event)"
            (multiSelectionChange)="onMultiSelectionChange($event)"
            (itemClick)="onItemClick($event)"
            (itemMouseDown)="onItemMouseDown($event)"
        ></ne-list>
    `,
    style: `
        .ne-tree.enable-selection {
            .ne-list-item.selected {
                background-color: $color.primary;
                color: #FFFFFF;
            }
        }
    `,
    requirements: [
        SvgIcon,
        List,
    ]
})
export class Tree<T> {
    @Property() indentSize = 16;
    @Property() active = true;
    @Property() onlyLeafSelection = false;
    @Property() autoExpand = false;
    @Property() enableSelection = true;
    @Property() enableMultiSelection = false;
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() selectedItems: T[] = [];
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() childrenField: string;
    @Property() childrenFunction: (item: T) => T[];
    // @Property() filterFunction: (item: T) => boolean;
    @Property() itemRenderer: IItemStateStatic<T>;
    // @Property() itemRendererBinding = {
    //     '[item]': 'item',
    //     '[itemIndex]': 'itemIndex',
    //     '[label]': 'label',
    //     '[selected]': 'selected',
    //     '[params]': 'params',
    // }
    @Property() itemRendererParams: any;

    @Emitter() treeUpdated: IEmitter<void>;
    @Emitter() treeRefreshed: IEmitter<void>;
    @Emitter() selectionChange: IEmitter<ITreeSelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<ITreeMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;
    @Emitter('item_click') itemClick: IEmitter<ITreeItemClickEvent<T>>;
    @Emitter('item_mousedown') itemMouseDown: IEmitter<ITreeItemClickEvent<T>>;

    @Element('list') list: IElementRef;

    @Inject(BINDING_TOKENS.INJECTOR) injector: IInjector;

    itemWrapperRenderer = DefaultTreeItemRendererWrapper;
    itemWrapperRendererBinding = {
        '[item]': 'item',
        '[params]': 'params',
    }
    itemWrapperRendererParams: any;
    flatDataProvider: any[] = [];
    selectedTreeItem: TreeDataItem = undefined;
    selectedTreeItems: TreeDataItem[] = [];
    treeDataProvider: TreeDataProvider;

    private _firstSelected = false;
    private _destroyed = false;

    onInit() {
        this.injector.providers([{
            token: 'tree_data_updated',
            use: this.treeUpdated
        }])
        this.treeDataProvider = new TreeDataProvider(
            this.dataProvider,
            this.enableMultiSelection ? this.selectedItems : (this.selectedItem === undefined ? null : [this.selectedItem]),
            {
                childrenField: this.childrenField,
                childrenFunction: this.childrenFunction,
                labelField: this.labelField,
                labelFunction: this.labelFunction,
            }
        );
        this.itemWrapperRendererParams = {
            onlyLeafSelection: this.onlyLeafSelection,
            itemRenderer: this.itemRenderer,
            // itemRendererBinding: this.itemRendererBinding,
            itemRendererParams: this.itemRendererParams,
        }
        this.treeDataProvider.updated.listen(() => {
            this.flatDataProvider = this.treeDataProvider.flatCollection.concat();
            if (this.enableMultiSelection) {
                this.selectedTreeItems = this.treeDataProvider.selectedItems;
            } else {
                this.selectedTreeItem = this.treeDataProvider.selectedItems ? this.treeDataProvider.selectedItems[0] : null;
            }
            this.list && this.list.detectChanges();
            setTimeout(() => {
                if (this._destroyed) return;
                this.treeUpdated.emit();
            })
        });
    }
    onChanges(changes: StateChanges) {
        if (changes) {
            let changed = false;
            if ('dataProvider' in changes) {
                this.treeDataProvider.setSource(this.dataProvider);
            }
            if ('selectedItem' in changes || 'enableSelection' in changes) {
                if (this.selectedItem && !this._firstSelected) {
                    this._firstSelected = true;
                    this.treeDataProvider.setSelectedDatas(this.selectedItem === undefined ? null : [this.selectedItem], true);
                } else {
                    this.treeDataProvider.setSelectedDatas(this.selectedItem === undefined ? null : [this.selectedItem]);
                }
            }
            if ('selectedItems' in changes || 'enableMultiSelection' in changes) {
                this.treeDataProvider.setSelectedDatas(this.selectedItems);
            }
            const option = this._collectTreeDataProviderOption(changes);
            if (option && !isEmpty(option)) {
                this.treeDataProvider.setOption(option);
            }
            if ('itemRenderer' in changes
                || 'itemRendererBinding' in changes
                || 'itemRendererParams' in changes
                || 'onlyLeafSelection' in changes
                || 'indentSize' in changes
            ) {
                this.itemWrapperRendererParams = {
                    indentSize: this.indentSize,
                    onlyLeafSelection: this.onlyLeafSelection,
                    itemRenderer: this.itemRenderer,
                    // itemRendererBinding: this.itemRendererBinding,
                    itemRendererParams: this.itemRendererParams,
                }
            }
        }
    }
    onDestroy() {
        this._destroyed = true;
        this.treeDataProvider && this.treeDataProvider.destroy();
    }
    protected onSelectedItemChange(e: TreeDataItem) {
        if (!this.enableMultiSelection) {
            this.treeDataProvider.setSelectedDatas([e.data]);
            this.selectedItemChange.emit(e.data);
        }
    }
    protected onSelectedItemsChange(e: TreeDataItem[]) {
        if (this.enableMultiSelection) {
            const selectedDatas = e.map(item => item.data);
            this.treeDataProvider.setSelectedDatas(selectedDatas);
            this.selectedItemsChange.emit(selectedDatas);
        }
    }
    protected onSelectionChange(e: ISelectionChangeEvent<TreeDataItem>) {
        const oldSelectedItem = e.oldSelectedItem ? this.treeDataProvider.getItemParentStack(e.oldSelectedItem) : [];
        const selectedItem = e.selectedItem ? this.treeDataProvider.getItemParentStack(e.selectedItem) : [];
        this.selectionChange.emit({
            dataProvider: this.dataProvider,
            oldSelectedItem: oldSelectedItem.map(item => item.data),
            selectedItem: selectedItem.map(item => item.data),
        })
    }
    protected onMultiSelectionChange(e: IMultiSelectionChangeEvent<TreeDataItem>) {
        const oldSelectedItems = (e.oldSelectedItems || []).map(item => this.treeDataProvider.getItemParentStack(item).map(item => item.data));
        const selectedItems = (e.selectedItems || []).map(item => this.treeDataProvider.getItemParentStack(item).map(item => item.data));
        this.multiSelectionChange.emit({
            dataProvider: this.dataProvider,
            oldSelectedItems: oldSelectedItems,
            selectedItems: selectedItems,
        })
    }
    protected onItemClick(e: IItemClickEvent<TreeDataItem>) {
        this.itemClick.emit({
            causeEvent: e.causeEvent,
            dataProvider: this.dataProvider,
            element: e.element,
            item: e.item.data,
            treeItem: e.item,
            itemStack: this.treeDataProvider.getItemParentStack(e.item).map(item => item.data),
            index: e.index,
        })
    }
    protected onItemMouseDown(e: IItemClickEvent<TreeDataItem>) {
        this.itemMouseDown.emit({
            causeEvent: e.causeEvent,
            dataProvider: this.dataProvider,
            element: e.element,
            item: e.item.data,
            treeItem: e.item,
            itemStack: this.treeDataProvider.getItemParentStack(e.item).map(item => item.data),
            index: e.index,
        })
    }
    private _optionKeys = [
        'labelField',
        'labelFunction',
        'childrenField',
        'childrenFunction',
        'onlyLeafSelection'
    ];
    private _collectTreeDataProviderOption(changes: StateChanges) {
        if (!changes) return null;
        const option = {};
        this._optionKeys.forEach(key => {
            if (key in changes) {
                option[key] = changes[key].newValue;
            }
        });
        return option;
    }
}