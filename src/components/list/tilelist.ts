import { createElement, getClientHeight, getScrollbarWidth, getSuggestSize, removeMe } from 'neurons-dom';
import { findAValidValue, isDefined, asPromise } from 'neurons-utils';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';
import { IChangeDetector } from '../../binding/common/interfaces';
import { bind, BINDING_TOKENS } from '../../binding';
import { Binding, Inject, Property } from '../../binding/factory/decorator';
import { DefaultItemState, List } from './list';
import { errorToMessage } from '../../binding/common/exception';
import { emitter, EventEmitter, IEmitter } from 'neurons-emitter';
import { Element, Emitter } from '../../binding/factory/decorator';
import { ISelectionChangeEvent, IItemStateStatic, IItemState, IItemClickEvent, IMultiSelectionChangeEvent } from '../interfaces';
import { defaultLabelFunction } from './list';
import { Input } from '../input/input';

@Binding({
    selector: 'ne-tile-list',
    template: `
        <div #container [class]="{'ne-tile-list': true, 'ne-list': true, 'enable-selection': enableSelection}" (scroll)="onScroll($event)">
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
        .ne-tile-list {
            max-height: initial;
        }
        .ne-tile-list .ne-list-content {
            box-sizing: border-box;
            font-size: 0;
        }
        .ne-tile-list .ne-list-item {
            display: inline-block;
            position: relative;
            box-sizing: border-box;
            font-size: 14px;
        }
    `,
    requirements: [
        List,
    ]
})
export class TileList extends List<any> {
    protected _containerSize: {width: number, height: number};
    protected _typicalWidth: number = undefined;
    onResize() {
        this._measureSize();
        this._resetNativeDataProvider();
    }
    protected _resetNativeDataProvider() {
        if (!this.active) return;
        const containerSize = this._containerSize;
        let colCount = 1, rowCount = 1;
        if (isNaN(containerSize.height)) {
            this.contentHeight = '';
        } else {
            if (this.filteredDataProvider.length && containerSize.width && containerSize.height && this._typicalWidth) {
                colCount = Math.floor(containerSize.width / this._typicalWidth)
                colCount = colCount || 1;
                rowCount = Math.ceil(this.filteredDataProvider.length / colCount);
                this.contentHeight = this._typicalHeight * rowCount;
            } else {
                this.contentHeight = 0;
            }
        }
        const isInfinition = this.contentHeight === '' || (containerSize.height && this.contentHeight <= containerSize.height);
        if (isInfinition) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = this.filteredDataProvider.length - 1;
        } else if (this.contentHeight <= 0) {
            this.offset = 0;
            this.startIndex = 0;
            this.endIndex = 0;
        } else {
            const rows = Math.max(1, Math.floor(containerSize.height / this._typicalHeight)) + 4;
            const scrollTop = this.container.scrollTop;
            let scrollRow = Math.floor(scrollTop / this._typicalHeight);
            const endRow = Math.min(rowCount - 1, scrollRow + rows);
            this.endIndex = Math.min(this.filteredDataProvider.length - 1, (endRow + 1) * colCount - 1);
            const startRow = endRow - Math.min(rows, rowCount - 1);
            this.startIndex = Math.min(this.filteredDataProvider.length - 1, startRow * colCount);
            this.offset = startRow * this._typicalHeight;
        }
        this.sliceDataProvider(this.filteredDataProvider, this.startIndex, this.endIndex);
    }
    protected _measureSize() {
        this._containerSize = getSuggestSize(this.container);
        const scrollBarWidth = getScrollbarWidth();
        this._containerSize.width = isNaN(this._containerSize.width) ? 0 : Math.max(this._containerSize.width - scrollBarWidth, 0);
        if (this.content.children.length > 1) {
            const child = this.content.children.item(0);
            const size = child.getBoundingClientRect();
            this._typicalHeight = Math.ceil(Math.max(size.height, child.clientHeight));
            this._typicalWidth = Math.ceil(Math.max(size.width, child.clientWidth));
        } else {
            const typicalData = findAValidValue(this.dataProvider);
            const container = createElement('div', 'ne-list-item');
            this.content.appendChild(container);
            const getItemLabel = () => {
                const label = this.getItemLabel(typicalData);
                return isDefined(label) && label !== '' ? label : '国';
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
            this._typicalHeight = Math.ceil(Math.max(size.height, container.clientHeight));
            this._typicalWidth = Math.ceil(Math.max(size.width, container.clientWidth));
            typicalRef.destroy();
            removeMe(container);
        }
        // 按滚动条宽度缩减
        if (this._typicalWidth) {
            let colCount = Math.floor(this._containerSize.width / this._typicalWidth)
            colCount = colCount || 1;
            const value = scrollBarWidth / colCount;
            this._typicalWidth = Math.floor(Math.max(this._typicalWidth - value, 0));
        }
    }
    protected _isInvalidTypicalSize() {
        if (this._typicalHeight === 0 || !isDefined(this._typicalHeight) || isNaN(this._typicalHeight)
            || this._typicalWidth === 0 || !isDefined(this._typicalWidth) || isNaN(this._typicalWidth)
        ) {
            return true;
        } else {
            if (this.content.children.length > 1) {
                const child = this.content.children.item(0);
                const size = child.getBoundingClientRect();
                const height = Math.max(size.height, child.clientHeight);
                const width = Math.max(size.width, child.clientWidth);
                if (height && width && (height !== this._typicalHeight || width !== this._typicalWidth)) {
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

export interface IAsyncDataProvider<T> {
    fetch(): Promise<T[]> | ObservableLike<T[]>;
    more(): Promise<T[]> | ObservableLike<T[]>;
    hasMore(): boolean;
}

export interface IAsyncListDataControl {
    addItem(index, item): void;
    updateItem(index, newItem, oldItem): void;
    removeItem(index, oldItem): void;
    removeRowsBy(ids: any[]): void;
    reset(): void;
    destroy(): void;

    itemAdded: IEmitter<{index: number, item: any}>;
    itemUpdated: IEmitter<{index: number, oldItem: any, newItem: any}>;
    itemRemoved: IEmitter<{index: number, item: any}>;
    rowRemovedBy: IEmitter<{ids: any[]}>;
    reseted: IEmitter<void>;
}

export class AsyncListDataControl implements IAsyncListDataControl {
    static create(): IAsyncListDataControl {
        return new AsyncListDataControl();
    }
    private _nativeEmitter = new EventEmitter();

    itemAdded: IEmitter<{index: number, item: any}> = emitter('item_added', this._nativeEmitter);
    itemUpdated: IEmitter<{index: number, oldItem: any, newItem: any}> = emitter('item_updated', this._nativeEmitter);
    itemRemoved: IEmitter<{index: number, item: any}> = emitter('item_remove', this._nativeEmitter);
    rowRemovedBy: IEmitter<{ids: any[]}> = emitter('row_remove_by', this._nativeEmitter);
    reseted: IEmitter<void> = emitter('reseted', this._nativeEmitter);
    addItem(index, item): void {
        this.itemAdded.emit({item: item, index: index});
    }
    updateItem(index, newItem, oldItem): void {
        this.itemUpdated.emit({index: index, newItem: newItem, oldItem: oldItem});
    }
    removeItem(index, oldItem): void {
        this.itemRemoved.emit({index: index, item: oldItem});
    }
    removeRowsBy(ids: any[]): void {
        if (!ids || !ids.length) return;
        this.rowRemovedBy.emit({ids: ids});
    }
    reset(): void {
        this.reseted.emit();
    }
    destroy() {
        this._nativeEmitter.off();
    }
}

@Binding({
    selector: 'ne-infinite-tile-list',
    template: `
        <div #container [class]="{'ne-infinite-tile-list': true, 'ne-tile-list': true, 'ne-list': true, 'enable-selection': enableSelection}" (scroll)="onScroll($event)">
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
                <div class="more-info" [class.error]="!!requestError">{{hasMoreMessage}}</div>
            </div>
            <div [class]="{'empty-info': true, 'show': initialLoaded && (!dataProvider || !dataProvider.length)}">无内容</div>
        </div>
    `,
    style: `
        .ne-infinite-tile-list {
            .more-info {
                position: absolute;
                height: 20px;
                width: 100%;
                bottom: 0;
                text-align: center;
                pointer-events: none;
            }
        }
    `,
    requirements: [
        List,
    ]
})
export class InfiniteTileList extends TileList {
    @Property() fetch: () => Promise<any[]> | ObservableLike<any[]>;
    @Property() more: () => Promise<any[]> | ObservableLike<any[]>;
    @Property() hasMore: () => boolean;
    @Property() idGetter: (item) => any;
    @Property() dataControl: IAsyncListDataControl;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    requestError = false;
    hasMoreMessage = '';
    retry;

    private _nativeControl: IAsyncListDataControl;
    private initialLoaded = false;
    private _querying = false;
    private _isArriveBottom = false;
    private _destroyed = false;
    private _timeID;
    private _listeners = [];
    onDestroy() {
        this._destroyed = true;
        clearTimeout(this._timeID);
        this._nativeControl && this._nativeControl.destroy();
        this._nativeControl = null;
        this._listeners.length && this._listeners.forEach(fn => fn());
        this._listeners = [];
    }
    onChanges(changes) {
        super.onChanges(changes);
        if (!changes || 'dataControl' in changes) {
            this._listeners.length && this._listeners.forEach(fn => fn());
            this._listeners = [];
            this._nativeControl && this._nativeControl.destroy();
            this._nativeControl = this.dataControl;
            if (this._nativeControl) {
                this._listeners.push(this._nativeControl.itemAdded.listen(e => {
                    if (this._destroyed) return;
                    this.requestDatas();
                }));
                this._listeners.push(this._nativeControl.itemRemoved.listen(e => {
                    if (this._destroyed) return;
                    this.dataProvider = (this.dataProvider || []).concat();
                    this.dataProvider.splice(e.index, 1);
                    this._resetDataProvider();
                    this.cdr.detectChanges();
                    this._updateScroll();
                }));
                this._listeners.push(this._nativeControl.rowRemovedBy.listen(e => {
                    if (this._destroyed) return;
                    if (!e.ids || !e.ids.length) return;
                    if (this.idGetter) {
                        const idMap = {};
                        e.ids.forEach(id => { idMap[id] = id });
                        this.dataProvider = (this.dataProvider || []).concat();
                        let changed = false;
                        for (let i = this.dataProvider.length - 1; i >= 0; i--) {
                            const id = this.idGetter(this.dataProvider[i]);
                            if (isDefined(id) && id in idMap) {
                                this.dataProvider.splice(i, 1);
                                changed = true;
                            }
                        }
                        if (changed) {
                            this._resetDataProvider();
                            this.cdr.detectChanges();
                            this._updateScroll();
                        }
                    }
                }));
                this._listeners.push(this._nativeControl.itemUpdated.listen(e => {
                    this.dataProvider = (this.dataProvider || []).concat();
                    this.dataProvider.splice(e.index, 1, e.newItem);
                    this._resetDataProvider();
                    this.cdr.detectChanges();
                    this._updateScroll();
                }));
                this._listeners.push(this._nativeControl.reseted.listen(e => {
                    if (this._destroyed) return;
                    this.requestDatas();
                }));
            }
        }
        this.requestDatas();
    }
    onResize() {
        super.onResize();
        this._updateScroll();
    }
    onScroll(e) {
        super.onScroll(e);
        this._updateScroll();
    }
    protected requestDatas() {
        if (this._destroyed) return;
        if (!this.fetch) return;
        clearTimeout(this._timeID);
        const request = () => {
            this._querying = true;
            this.requestError = false;
            this.hasMoreMessage = '';
            asPromise(this.fetch()).then(results => {
                if (this._destroyed) return;
                this._querying = false;
                this.initialLoaded = true;
                this.requestError = false;
                this.hasMoreMessage = '';
                this.dataProvider = (results || []).concat();
                this._resetDataProvider();
                this.cdr.detectChanges();
                this._updateScroll();
            }).catch(error => {
                if (this._destroyed) return;
                this._querying = false;
                this.requestError = true;
                this.hasMoreMessage = '查询异常，请点击重试';
                this.retry = request;
                this.cdr.detectChanges();
            })
        }
        this._timeID = setTimeout(request, 30);
    }
    protected requestMore() {
        if (this._destroyed) return;
        if (!this.initialLoaded) return;
        if (this._querying) return;
        if (!this.more) return;
        const request = () => {
            this._querying = true;
            this.requestError = false;
            this.hasMoreMessage = this.initialLoaded ? '加载中...' : '';
            asPromise(this.more()).then(results => {
                if (this._destroyed) return;
                this._querying = false;
                this.requestError = false;
                this.hasMoreMessage = '';
                this.dataProvider = (this.dataProvider || []).concat(results || []);
                this._resetDataProvider();
                this.cdr.detectChanges();
                this._updateScroll();
            }).catch(error => {
                if (this._destroyed) return;
                this._querying = false;
                this.requestError = true;
                this.hasMoreMessage = '查询异常，请点击重试';
                this.retry = request;
                this.cdr.detectChanges();
            })
        }
        request();
    }
    private _updateScroll() {
        this._isArriveBottom = this.isScrollArriveBottom(this.container);
        if (this.hasMore && this.hasMore() && this._isArriveBottom) {
            this.requestMore();
            this.cdr.detectChanges();
        }
    }
    private isScrollArriveBottom(scrollContainer: HTMLElement) {
        // 判断距离底部的距离
        const scrollHight = scrollContainer.scrollHeight;
        const scrollTop = scrollContainer.scrollTop;
        const height = getClientHeight(scrollContainer);
        return scrollTop + height >= scrollHight;
    }
}

@Binding({
    selector: 'ne-searchable-tile-list',
    template: `
        <div class="ne-searchable-tile-list">
            <ne-input class="ne-searchable-tile-list-input" [placeholder]="placeholder" [focus]="focus" [(value)]="searchKey" (change)="onSearch()"></ne-input>
            <ne-tile-list
                class="ne-searchable-tile-list-content"
                [active]="active"
                [enableSelection]="enableSelection"
                [enableMultiSelection]="enableMultiSelection"
                [dataProvider]="dataProvider"
                [(selectedItem)]="selectedItem"
                [(selectedItems)]="selectedItems"
                [labelField]="labelField"
                [labelFunction]="labelFunction"
                [filterFunction]="filterFunction"
                [itemRenderer]="itemRenderer"
                [itemRendererBinding]="itemRendererBinding"
                [itemRendererParams]="itemRendererParams"
                (selectionChange)="selectionChange.emit($event)"
                (multiSelectionChange)="multiSelectionChange.emit($event)"
                (itemClick)="itemClick.emit($event)"
                (itemMouseDown)="itemMouseDown.emit($event)"
            ></ne-tile-list>
        </div>
    `,
    style: `
        .ne-searchable-tile-list {

        }
        .ne-searchable-tile-list .ne-searchable-tile-list-input {
            width: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
        .ne-searchable-tile-list .ne-searchable-tile-list-content {

        }
    `,
    requirements: [
        DefaultItemState,
        Input,
        List
    ]
})
export class SearchableTileList<T> {
    @Property() focus = false;
    @Property() active = true;
    @Property() placeholder = '';
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

    searchKey: string = '';

    onInit() {
        this._resetSearch();
    }
    onSearch() {
        this._resetSearch();
    }
    getItemLabel(item: T) {
        if (this.labelFunction) return this.labelFunction(item);
        return defaultLabelFunction(item, this.labelField);
    }
    private _resetSearch() {
        this.filterFunction = (item) => {
            const searchKey = this.searchKey || '';
            if (!searchKey) return true;
            const label = this.getItemLabel(item) || '';
            return label.indexOf(searchKey) !== -1;
        }
    }
}