import { Binding, Property, Element, Emitter } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector } from '../../binding/common/interfaces';
import { ISelectionChangeEvent, IItemStateStatic, IItemState, IItemClickEvent, IMultiSelectionChangeEvent } from '../interfaces';
import { bind } from '../../binding';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { DefaultItemState, List, defaultLabelFunction } from './list';
import { Input } from '../input/input';

@Binding({
    selector: 'ne-searchable-list',
    template: `
        <div class="ne-searchable-list">
            <ne-input class="ne-searchable-list-input" [placeholder]="placeholder" [focus]="focus" [(value)]="searchKey" (change)="onSearch()"></ne-input>
            <ne-list
                class="ne-searchable-list-content"
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
            ></ne-list>
        </div>
    `,
    style: `
        .ne-searchable-list {

        }
        .ne-searchable-list .ne-searchable-list-input {
            width: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
        .ne-searchable-list .ne-searchable-list-content {

        }
    `,
    requirements: [
        DefaultItemState,
        Input,
        List
    ]
})
export class SearchableList<T> {
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