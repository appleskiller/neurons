import { createElement, getScrollbarWidth, getSuggestSize, removeMe } from 'neurons-dom';
import { findAValidValue, isDefined, asPromise } from 'neurons-utils';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';
import { IChangeDetector } from '../../binding/common/interfaces';
import { bind, BINDING_TOKENS } from '../../binding';
import { Binding, Inject, Property } from '../../binding/factory/decorator';
import { DefaultItemState, List } from './list';
import { errorToMessage } from '../../binding/common/exception';

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
            this._typicalHeight = Math.ceil(size.height);
            this._typicalWidth = Math.ceil(size.width);
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
            this._typicalWidth = Math.ceil(size.width);
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
                if (size.height && size.width && (size.height !== this._typicalHeight || size.width !== this._typicalWidth)) {
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

@Binding({
    selector: 'ne-infinite-tile-list',
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
                <div class="more-info" [class.error]="!!requestError">{{hasMoreMessage}}</div>
            </div>
            <div [class]="{'empty-info': true, 'show': initialLoaded && (!dataProvider || !dataProvider.length)}">无内容</div>
        </div>
    `,
    style: `
    `,
    requirements: [
        List,
    ]
})
export class InfiniteTileList extends TileList {
    @Property() fetch: () => Promise<any[]> | ObservableLike<any[]>;
    @Property() more: () => Promise<any[]> | ObservableLike<any[]>;
    @Property() hasMore: () => boolean;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    requestError = false;
    hasMoreMessage = '';
    retry;

    private initialLoaded = false;
    private querying = false;
    private _destroyed = false;
    onDestroy() {
        this._destroyed = true;
    }
    onChanges(changes) {
        super.onChanges(changes);
        if ((!changes || 'fetch' in changes) && !!this.fetch) {
            this.requestDatas();
        }
    }
    onResize() {
        super.onResize();
        // TODO
    }
    protected requestDatas() {
        if (this._destroyed) return;
        if (!this.fetch) return;
        const request = () => {
            this.requestError = false;
            this.hasMoreMessage = this.initialLoaded ? '正在请求...' : '';
            asPromise(this.fetch()).then(results => {
                if (this._destroyed) return;
                this.initialLoaded = true;
                this.requestError = false;
                this.hasMoreMessage = '';
                // TODO
            }).catch(error => {
                if (this._destroyed) return;
                this.requestError = true;
                this.hasMoreMessage = '查询异常，请点击重试';
                this.retry = request;
            })
        }
        request();
    }
    protected requestMore() {
        if (this._destroyed) return;
        if (!this.more) return;
        const request = () => {
            this.requestError = false;
            this.hasMoreMessage = this.initialLoaded ? '正在请求...' : '';
            asPromise(this.more()).then(results => {
                // TODO
                if (this._destroyed) return;
                this.requestError = false;
                this.hasMoreMessage = '';
            }).catch(error => {
                if (this._destroyed) return;
                this.requestError = true;
                this.hasMoreMessage = '查询异常，请点击重试';
                this.retry = request;
            })
        }
        request();
    }
}