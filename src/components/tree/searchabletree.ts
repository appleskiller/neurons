
import { IEmitter } from 'neurons-emitter';
import { IChangeDetector } from '../../binding/common/interfaces';
import { Binding, Emitter, Inject, Property } from '../../binding/factory/decorator';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { SvgIcon } from '../icon/svgicon';
import { SearchInput } from '../input/search';
import { defaultLabelFunction } from '../list/list';
import { theme } from '../style/theme';
import { Tree } from './tree';

@Binding({
    selector: 'ne-searchable-tree',
    template: `
        <div class="ne-searchable-tree">
            <ne-search-input
                *if="!hideSeachInput"
                [(value)]="searchKey"
                (change)="onSearch()"
            ></ne-search-input>
            <ne-list
                #list
                class="ne-tree"
                [class.only-leaf-selection]="onlyLeafSelection"
                [style.top]="hideSeachInput ? '0' : ''"
                [active]="active"
                [enableSelection]="enableSelection"
                [enableMultiSelection]="enableMultiSelection"
                [disableClickSelection]="disableClickSelection"
                [dataProvider]="flatDataProvider"
                [filterFunction]="_filterFunction"
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
        </div>
    `,
    style: `
        .ne-searchable-tree {
            & > .ne-search-input {
                height: 36px;
                line-height: 36px;
                background-color: ${theme.gray.light};
                border-bottom: solid 1px ${theme.gray.normal};
                box-sizing: border-box;
            }
        }
    `,
    requirements: [
        SvgIcon,
        Tree,
        SearchInput,
    ]
})
export class SearchableTree<T> extends Tree<T> {

    @Property() searchField: string;
    @Property() searchKey = '';
    @Property() hideSeachInput = false;

    @Emitter() searchKeyChange: IEmitter<string>;
    
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    showSearch = false;
    _filterFunction = null;
    searchedItems = [];

    onInit() {
        super.onInit();
        this._filterFunction = this.filterFunction ? item => this.filterFunction(item.data) : null;
        if (this.searchKey) {
            this._doSearch();
        }
    }
    onChanges(changes) {
        super.onChanges(changes);
        if (changes && 'filterfunction' in changes) {
            if (this.showSearch) {
                this._filterFunction = item => {
                    const visible = this.filterFunction ? this.filterFunction(item.data) : true;
                    if (!visible) return false;
                    return this.searchedItems.indexOf(item.data) !== -1;
                }
            } else {
                this._filterFunction = this.filterFunction ? item => this.filterFunction(item.data) : null;
            }
        }
        if (changes && 'searchKey' in changes) {
            this.laterSearch();
        }
    }
    onDestroy() {
        clearTimeout(this._searchId);
        super.onDestroy();
    }

    onSearch() {
        this.searchKeyChange.emit(this.searchKey);
        this.laterSearch();
    }
    
    private _searchId;
    protected laterSearch() {
        clearTimeout(this._searchId);
        this._searchId = setTimeout(() => {
            if (this._destroyed) return;
            this._doSearch();
            this.cdr.detectChanges();
        }, 150);
    }
    private _doSearch() {
        const searchKey = (this.searchKey || '').trim().toLowerCase();
        if (!searchKey) {
            this.showSearch = false;
            this._filterFunction = this.filterFunction ? item => this.filterFunction(item.data) : null;
            this.treeDataProvider.restoreExpands();
        } else {
            if (this.showSearch !== true) {
                this.treeDataProvider.saveExpands();
                this.showSearch = true;
            }
            this.searchedItems = [];
            this._searchBy(this.dataProvider, searchKey, this.searchedItems);
            this._filterFunction = item => {
                const visible = this.filterFunction ? this.filterFunction(item.data) : true;
                if (!visible) return false;
                return this.searchedItems.indexOf(item.data) !== -1;
            }
            this.treeDataProvider.expandAll();
        }
    }
    private _searchBy(nodes: any[], searchKey: string, allMatched?, result?) {
        if (!nodes || !nodes.length) return result;
        nodes.forEach(node => {
            const children = this._getChildren(node);
            let matched;
            if (children && children.length) {
                matched = this._searchBy(children, searchKey, allMatched, matched);
            }
            if (matched && matched.length) {
                result = result || [];
                allMatched && allMatched.push(node);
                result.push(node);
            } else {
                const label = this._getSearchLabel(node).toLowerCase();
                if (label.indexOf(searchKey) !== -1) {
                    result = result || [];
                    allMatched && allMatched.push(node);
                    result.push(node);
                }
            }
        })
        return result;
    }
    private _cloneNode(node, children?) {
        if (!node) return null;
        const clone = {...node};
        if (this.childrenField) {
            if (children && children.length) {
                clone[this.childrenField] = children;
            } else {
                clone[this.childrenField] = this._isLeaf(node) ? null : [];
            }
        }
        return clone;
    }
    private _isLeaf(node) {
        return !this._getChildren(node);
    }
    private _getSearchLabel(node) {
        if (this.searchField) return defaultLabelFunction(node, this.searchField);
        if (this.labelFunction) return this.labelFunction(node);
        return defaultLabelFunction(node, this.labelField);
    }
    private _getChildren(node) {
        if (!node) return null;
        if (this.childrenFunction) return this.childrenFunction(node);
        const childrenField = this.childrenField || 'children';
        if (childrenField in node) {
            return node[childrenField];
        } else {
            return null;
        }
    }
}