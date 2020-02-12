import { ISVGIcon } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { IChangeDetector, IBindingRef, StateChanges } from '../../binding/common/interfaces';
import { bind } from '../../binding';
import { Element, Property, Binding, Emitter } from '../../binding/factory/decorator';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IItemClickEvent, IItemStateStatic, IMultiSelectionChangeEvent, ISelectionChangeEvent } from '../interfaces';
import { DefaultItemState, defaultLabelFunction } from './list';

@Binding({
    selector: 'ne-list-item-wrapper',
    template: `
        <div #container [class.ne-list-item]="true"
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

export class ListBase<T> {
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

    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;
    @Emitter('item_click') itemClick: IEmitter<IItemClickEvent<T>>;
    @Emitter('item_mousedown') itemMouseDown: IEmitter<IItemClickEvent<T>>;

    @Element('content') content: HTMLElement;

    filteredDataProvider: T[] = [];
    nativeDataProvider: T[] = [];
    itemRefs: IBindingRef<any>[] = [];

    onInit() {
        this.dataProvider = this.dataProvider || [];
        this._resetDataProvider();
    }
    onChanges(changes: StateChanges) {
        if (changes && 'dataProvider' in changes) {
            this.dataProvider = this.dataProvider || [];
        }
        if (changes && this.shouldResetRenderer(changes)) {
            this._resetDataProvider();
        }
    }
    onDestroy() {
        this.itemRefs.forEach(ref => ref.destroy());
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
    protected shouldResetRenderer(changes: StateChanges): boolean {
        return changes
            && ('dataProvider' in changes
                || 'filterFunction' in changes
                || 'active' in changes
                || 'itemRenderer' in changes
                || 'itemRendererParams' in changes
                || 'labelField' in changes
                || 'labelFunction' in changes
                || 'selectedItems' in changes
            );
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
    protected _resetDataProvider() {
        if (!this.active) return;
        if (this.dataProvider.length) {
            // 过滤
            if (this.filterFunction) {
                this.filteredDataProvider = (this.dataProvider || []).filter(item => this.filterFunction(item));
            } else {
                this.filteredDataProvider = this.dataProvider;
            }
            this.nativeDataProvider = this._collectNativeDataProvider(this.filteredDataProvider);
        } else {
            if (this.nativeDataProvider.length) {
                this.nativeDataProvider = [];
            }
        }
        if (this.nativeDataProvider.length) {
            for (let i = 0; i <= this.nativeDataProvider.length; i++) {
                let ref = this.itemRefs[i];
                if (!ref) {
                    ref = this.createItemRenderer(this.nativeDataProvider[i], i);
                    this.itemRefs.push(ref);
                } else {
                    ref.setState(this.wrapItemState(this.nativeDataProvider[i], i));
                }
            }
        }
        // 清理ref
        const len = (this.nativeDataProvider || []).length;
        for (var i: number = this.itemRefs.length - 1; i >= len; i--) {
            this.itemRefs[i].destroy();
            this.itemRefs.splice(i, 1);
        }
    }
    protected _collectNativeDataProvider(filteredDataProvider) {
        return filteredDataProvider;
    }
}

