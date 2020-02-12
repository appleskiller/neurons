import { DropDownList } from './dropdown';
import { TileList } from '../list/tilelist';
import { theme } from '../style/theme';
import { Binding, Property, Element, Emitter, Inject } from '../../binding/factory/decorator';
import { SearchableList } from '../list/seachablelist';
import { IUIStateStatic, IBindingDefinition, IChangeDetector, BindingSelector, BindingTemplate, IBindingRef } from '../../binding/common/interfaces';
import { ISVGIcon, createElement } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { ISelectionChangeEvent, IItemClickEvent, IItemStateStatic, IMultiSelectionChangeEvent } from '../interfaces';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IPopupOption } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk/popup/manager';
import { SvgIcon } from '../icon/svgicon';
import { caret_down } from '../icon/icons';
import { List, DefaultItemState, defaultLabelFunction } from '../list/list';
import { bind } from '../../binding';
import { scrollManager } from '../../cdk/scroll/manager';
import { isDefined } from 'neurons-utils';

@Binding({
    selector: 'ne-select-item-wrapper',
    template: `
        <div #container [class.ne-select-item]="true"
            [class.selected]="selected"
            (click)="onItemClick($event)"
        ></div>
    `
})
export class SelectItemRendererWrapper<T> {
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
    selector: 'ne-select',
    template: `
        <div #trigger [class]="{'ne-select-trigger': true, 'opened': opened, 'invalid': invalid}" [title]="tooltip" (mouseup)="onClick($event)">
            <div class="ne-select-trigger-inffix" #scrollContainer>
                <div class="ne-select-trigger-labels" #labelContainer></div>
            </div>
            <ne-icon class="ne-dropdown-trigger-icon" [icon]="caretIcon"></ne-icon>
        </div>
    `,
    style: `
        .ne-select-trigger {
            display: block;
            vertical-align: middle;
            position: relative;
            width: 100%;
            min-height: 36px;
            height: 100%;
            cursor: pointer;
            user-select: none;
            box-sizing: border-box;
            background-color: transparent;
            transition: ${theme.transition.normal('background-color', 'border-color')};
        }
        .ne-select-trigger:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
        .ne-select-trigger.opened,
        .ne-select-trigger:active {
            background-color: rgba(125, 125, 125, 0.24);
        }
        .ne-select-trigger .ne-dropdown-trigger-icon {
            position: absolute;
            top: 0px;
            bottom: 0px;
            right: 4px;
            width: initial;
            margin: auto;
        }
        .ne-select-trigger.invalid {
            border-color: ${theme.color.error}
        }
        .ne-select-trigger .ne-select-trigger-inffix {
            padding: 0 12px 0 12px;
            position: absolute;
            overflow: hidden;
            top: 0;
            bottom: 0;
            margin: auto;
            left: 0;
            right: 0;
            height: 40px;
        }
        .ne-select-trigger .ne-select-trigger-inffix .ne-select-item {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
            display: inline-block;
            padding: 6px 12px;
            border-radius: 3px;
            color: #FFF;
            background-color: ${theme.color.secondary};
            margin: 4px;
            max-width: 200px;
        }
        .ne-select-trigger .ne-select-trigger-labels {
            overflow: hidden;
            overflow-x: auto;
        }
    `,
    requirements: [
        TileList
    ]
})
export class Select<T> {
    @Property() caretIcon = caret_down;

    @Property() required = false;
    @Property() active = true;
    @Property() enableSelection = true;
    @Property() enableMultiSelection = false;
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() selectedItems: T[] = [];
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() itemRendererParams: any;
    
    @Property() dropdownClass: string = '';
    @Property() dropdownOverlayClass: string = '';

    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;

    @Element('trigger') trigger: HTMLElement;
    @Element('labelContainer') labelContainer: HTMLElement;
    @Element('scrollContainer') scrollContainer: HTMLElement;
    
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    tooltip = '请选择...';
    opened = false;

    invalid = false;

    private listContainer: HTMLElement = createElement('div', 'ne-select-popup-list-panel');
    private labelRefs: IBindingRef<T>[] = [];
    private listRefs: IBindingRef<T>[] = [];
    private recycleRefs: IBindingRef<T>[] = [];

    onInit() {
        scrollManager.enableDragScroll(this.scrollContainer, {
            direction: 'horizontal',
            proxySelector: '.ne-select-trigger-labels',
            controlButton: 'default',
            // controlScrollSpeed: number;
        });
    }

    onChanges(changes) {
        this.tooltip = this.getTooltipDisplay();
        this.selectedItems = this.selectedItems || [];
        if (this.required) {
            if (this.enableMultiSelection) {
                if (this.dataProvider) {
                    this.invalid = !this.selectedItems.length;
                } else {
                    this.invalid = false;
                }
            } else {
                if (this.dataProvider) {
                    this.invalid = this.dataProvider.indexOf(this.selectedItem) === -1;
                } else {
                    this.invalid = false;
                }
            }
        }
        if (!changes
            || 'dataProvider' in changes
            || 'itemRenderer' in changes
            || 'itemRendererParams' in changes
            || 'selectedItems' in changes
            || 'selectedItem' in changes
            || 'active' in changes
        ) {
            // 重新测量
            this._resetList();
        }
    }
    onDestroy() {
        scrollManager.disableDragScroll(this.scrollContainer);
        this.labelRefs.forEach(ref => ref.destroy());
        this.listRefs.forEach(ref => ref.destroy());
        this.recycleRefs.forEach(ref => ref.destroy());
    }
    onClick(e: MouseEvent) {
        setTimeout(() => {
            if (e.defaultPrevented) return;
            this.openSelectionList();
        })
    }
    openSelectionList() {
        const state = {
            focus: true, // searchable,
            onClick: () => {
                if (!this.listRefs.length) {
                    ref.close();
                } else {
                    ref.updatePosition();
                }
            }
        }
        const extraClass = this._isSearchable() ? 'ne-searchable-select-popup' : '';
        const ref = popupManager.open(this.listContainer, {
            connectElement: this.trigger,
            popupMode: 'dropdown',
            position: 'topLeft',
            panelClass: `${this.dropdownClass} ne-dropdown-popup-list ${extraClass}`,
            overlayClass: this.dropdownOverlayClass,
            binding: {
                '[focus]': 'focus',
                '(click)': 'onClick()'
            },
            state: state,
        })
        ref.onOpened.listen(() => {
            this.opened = true;
            this.changeDetector.detectChanges();
        });
        ref.onClose.listen(() => {
            this.opened = false;
            this.changeDetector.detectChanges();
        });
    }
    getTooltipDisplay() {
        if (this.enableMultiSelection) {
            if (!this.selectedItems.length) {
                return '请选择...';
            } else {
                return this.selectedItems.map(item => {
                    return this._getTooltipDisplay(item);
                }).join(', ');
            }
        } else {
            return this._getTooltipDisplay(this.selectedItem);
        }
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
            const oldSelectedItems = (this.selectedItems || []).concat();
            const index = this.selectedItems.indexOf(item);
            if (index !== -1) {
                const index = this.selectedItems.indexOf(item);
                this.selectedItems.splice(index, 1);
                this._unsetSelectedItem(item);
            } else {
                this.selectedItems.push(item);
                this._setSelectedItem(item);
            }
            this.selectedItemsChange.emit(this.selectedItems);
            this.multiSelectionChange.emit({
                selectedItems: this.selectedItems,
                dataProvider: this.dataProvider,
                oldSelectedItems: oldSelectedItems
            });
        } else {
            const oldSelectedItem = this.selectedItem;
            if (this.selectedItem === item) {
                this.selectedItem = null;
                this._unsetSelectedItem(item);
            } else {
                this.selectedItem = item;
                this._setSelectedItem(item);
            }
            this.selectedItemChange.emit(this.selectedItem);
            this.selectionChange.emit({
                selectedItem: this.selectedItem,
                dataProvider: this.dataProvider,
                oldSelectedItem: oldSelectedItem
            });
        }
        scrollManager.refreshDragScroll(this.scrollContainer);
    }
    private _getTooltipDisplay(item) {
        if (!isDefined(item)) {
            return '请选择...';
        } else {
            if (this.labelFunction) return this.labelFunction(item);
            return defaultLabelFunction(item, this.labelField);
        }
    }
    private _setSelectedItem(item) {
        const index = this.listRefs.findIndex(ref => ref['__item'] === item);
        if (index !== -1) {
            const ref = this.listRefs.splice(index, 1)[0];
            ref.detach();
            ref.appendTo(this.labelContainer);
            this.labelRefs.push(ref);
        }
    }
    private _unsetSelectedItem(item) {
        const index = this.labelRefs.findIndex(ref => ref['__item'] === item);
        if (index !== -1) {
            const ref = this.labelRefs.splice(index, 1)[0];
            ref.detach();
            ref.appendTo(this.listContainer);
            this.listRefs.push(ref);
        }
    }
    private _resetList() {
        this.recycleRefs = this.recycleRefs.concat(this.labelRefs).concat(this.listRefs);
        this.labelRefs = [];
        this.listRefs = [];
        const selectedItems = this.selectedItems || [];
        let ref: IBindingRef<T>;
        if (this.enableMultiSelection) {
            this.dataProvider.forEach((item, index) => {
                ref = this.createItemRenderer(item, index);
                ref.setState(this.wrapItemState(item, index));
                if (selectedItems.indexOf(item) !== -1) {
                    ref.appendTo(this.labelContainer);
                    this.labelRefs.push(ref);
                } else {
                    ref.appendTo(this.listContainer);
                    this.listRefs.push(ref);
                }
                ref['__item'] = item;
            })
        } else {
            this.dataProvider.forEach((item, index) => {
                ref = this.createItemRenderer(item, index);
                ref.setState(this.wrapItemState(item, index));
                if (this.selectedItem === item) {
                    ref.appendTo(this.labelContainer);
                    this.labelRefs.push(ref);
                } else {
                    ref.appendTo(this.listContainer);
                    this.listRefs.push(ref);
                }
                ref['__item'] = item;
            });
        }
    }
    private _isSearchable() {
        return this.dataProvider && this.dataProvider.length > 20;
    }
    protected createItemRenderer(item: T, index: number): IBindingRef<any> {
        const state = this.wrapItemState(item, index);
        state['onItemClick'] = (e) => {
            this.onItemClick(e.causeEvent, e.item, e.index);
        };
        const recycle = this.recycleRefs.pop();
        if (recycle) {
            recycle.setState(state);
            return recycle;
        } else {
            const ref = bind(SelectItemRendererWrapper, {
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
}