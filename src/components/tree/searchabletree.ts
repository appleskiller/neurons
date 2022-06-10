
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
import { arrow_left, arrow_right, search } from '../icon/icons';
import { SearchInput } from '../input/search';
import { ITreeItemClickEvent, ITreeMultiSelectionChangeEvent, ITreeSelectionChangeEvent, Tree } from './tree';

@Binding({
    selector: 'ne-searchable-tree',
    template: `
        <div class="ne-searchable-tree">
        <div class="ui-select-org-header">
            <ne-search-input
                [(value)]="searchKey"
                (change)="onSearch()"
            ></ne-search-input>
        </div>
            <div class="ui-select-org-body">
                <ne-list
                    #list
                    class="ne-tree"
                    [class.only-leaf-selection]="onlyLeafSelection"
                    [active]="active"
                    [enableSelection]="enableSelection"
                    [enableMultiSelection]="enableMultiSelection"
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
        </div>
    `,
    style: `
        .ne-searchable-tree {
            
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
    
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    searchKey = '';
    showSearch = false;
    _filterFunction = null;
    searchedItems = [];

    onInit() {
        super.onInit();
        this._filterFunction = this.filterFunction ? item => this.filterFunction(item.data) : null;
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
    }

    onSearch() {
        this.laterSearch();
    }
    
    private _searchId;
    protected laterSearch() {
        clearTimeout(this._searchId);
        this._searchId = setTimeout(() => {
            if (this._destroyed) return;
            this._doSearch();
            this.cdr.detectChanges();
        }, 300);
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