
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
import { SearchInput } from '../input/search';
import { Tree } from './tree';

@Binding({
    selector: 'ne-searchable-tree',
    template: `
        <div class="ne-searchable-tree">
            <ne-search-input [placeholder]="placeholder" [focus]="focus" [(value)]="searchKey" (change)="onSearch()"/>
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
        </div>
    `,
    style: `
        .ne-searchable-tree {
            .ne-search-input {
                line-height: 32px;
                background-color: $gray.light;
                border-bottom: solid 1px $gray.normal;
                &:focus {
                    border-bottom: solid 1px $color.primary;
                }
            }
        }
    `,
    requirements: [
        SvgIcon,
        List,
        SearchInput,
    ]
})
export class SearchableTree<T> extends Tree<T> {
    @Property() focus = false;
    @Property() placeholder = '';

    searchKey = '';
    onSearch() {
    }
}