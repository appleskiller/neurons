import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { IUIStateStatic, IBindingDefinition, IChangeDetector, BindingSelector, BindingTemplate } from '../../binding/common/interfaces';
import { ISVGIcon } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { ISelectionChangeEvent, IItemClickEvent, IItemStateStatic, IMultiSelectionChangeEvent } from '../interfaces';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IPopupOption, IPopupRef } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk/popup/manager';
import { SvgIcon } from '../icon/svgicon';
import { caret_down } from '../icon/icons';
import { List, DefaultItemState, defaultLabelFunction } from '../list/list';
import { SearchableList } from '../list/seachablelist';
import { theme } from '../style/theme';
import { isDefined } from 'neurons-utils';
import { ClassLike } from 'neurons-injector';

export interface IDropDownPopupOption<T> {
    component: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>,
    option?: IPopupOption<T>
}

@Binding({
    selector: 'ne-dropdown-button',
    template: `
        <div #trigger [class]="{'ne-dropdown-button': true, 'opened': opened}" (click)="onClick($event)">
            <div class="ne-dropdown-button-inffix" [title]="label"><div>{{label}}</div></div>
            <ne-icon class="ne-dropdown-trigger-icon" [icon]="caretIcon"></ne-icon>
        </div>
    `,
    style: `
        .ne-dropdown-button {
            display: inline-block;
            position: relative;
            cursor: pointer;
            user-select: none;
        }
        .ne-dropdown-button .ne-dropdown-trigger-icon {
            position: absolute;
            top: 0px;
            bottom: 0px;
            right: 4px;
            width: initial;
            margin: auto;
        }
        .ne-dropdown-button .ne-dropdown-button-inffix {
            padding: 0 18px 0 6px;
        }
        .ne-dropdown-button .ne-dropdown-button-inffix > div {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class DropDownButton<T> {
    @Property() dropdownPanel: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>;
    @Property() dropdownPanelBinding: IBindingDefinition;
    @Property() dropdownPanelState: T;
    @Property() dropdownPosition: string = 'bottomLeft';
    @Property() label: string = '按钮';
    @Property() caretIcon = caret_down;
    @Property() openFunction: (e: MouseEvent) => IDropDownPopupOption<T> = null;
    @Element('trigger') trigger: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    @Emitter() panelOpened: IEmitter<IPopupRef<any>>;
    @Emitter() panelClosed: IEmitter<void>;
    opened = false;

    onClick(e) {
        let openOption = this.openFunction ? this.openFunction(e) : {} as IDropDownPopupOption<T>;
        openOption = openOption || {} as IDropDownPopupOption<T>;
        const dropdownPanel = openOption.component || this.dropdownPanel;
        if (!dropdownPanel) return;
        const popupOption = {
            connectElement: this.trigger,
            panelClass: 'ne-dropdown-popup-panel',
            popupMode: 'dropdown',
            position: this.dropdownPosition || 'bottomLeft',
            binding: this.dropdownPanelBinding,
            state: this.dropdownPanelState,
            ...(openOption.option || {}),
        }
        popupOption.panelClass = popupOption.panelClass || '';
        popupOption.panelClass.indexOf('ne-dropdown-popup-panel') === -1 && (popupOption.panelClass = `ne-dropdown-popup-panel ${popupOption.panelClass}`)

        const ref = popupManager.open(dropdownPanel, popupOption as IPopupOption<T>);
        ref.onOpened.listen(() => {
            this.opened = true;
            this.panelOpened.emit(ref);
        });
        ref.onClosed.listen(() => {
            this.opened = false;
            this.panelClosed.emit();
            this.changeDetector.detectChanges();
        });
    }
}

@Binding({
    selector: 'ne-dropdown-list',
    template: `
        <div #trigger [class]="{'ne-dropdown-list-trigger': true, 'opened': opened, 'invalid': invalid}" [title]="label" (click)="onClick($event)">
            <div class="ne-dropdown-list-trigger-inffix"><div>{{label}}</div></div>
            <ne-icon class="ne-dropdown-trigger-icon" [icon]="caretIcon"></ne-icon>
        </div>
    `,
    style: `
        .ne-dropdown-list-trigger {
            display: inline-block;
            position: relative;
            padding: 4px 0;
            width: 100%;
            cursor: pointer;
            user-select: none;
            border: solid 1px transparent;
            border-radius: 4px;
            background-color: rgba(125, 125, 125, 0.12);
            transition: ${theme.transition.normal('background-color', 'border-color')};
            box-sizing: border-box;
        }
        .ne-dropdown-list-trigger:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
        .ne-dropdown-list-trigger.opened,
        .ne-dropdown-list-trigger:active {
            background-color: rgba(125, 125, 125, 0.24);
        }
        .ne-dropdown-list-trigger .ne-dropdown-trigger-icon {
            position: absolute;
            top: 0px;
            bottom: 0px;
            right: 4px;
            width: initial;
            margin: auto;
        }
        .ne-dropdown-list-trigger.invalid {
            border-color: ${theme.color.error}
        }
        .ne-dropdown-list-trigger .ne-dropdown-list-trigger-inffix {
            padding: 0 18px 0 10px;
        }
        .ne-dropdown-list-trigger .ne-dropdown-list-trigger-inffix > div {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
        .ne-dropdown-popup-list .ne-popup-panel-content {
            padding: 4px 0;
        }
        .ne-dropdown-popup-list .ne-list .ne-list-item {
            padding: 0 10px;
            line-height: 24px;
            transition: none;
        }
        .ne-dropdown-popup-list .ne-list.enable-selection .ne-list-item.selected {
            background-color: ${theme.color.primary};
            color: rgba(255,255,255,0.8);
        }
        .ne-dropdown-popup-list.ne-searchable-list-popup .ne-popup-panel-content {
            padding-top: 0;
        }
        .ne-dropdown-popup-list.ne-searchable-list-popup .ne-popup-panel-content .ne-searchable-list .ne-searchable-list-input {
            width: 100%;
            margin-bottom: 4px;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    `,
    requirements: [
        SvgIcon,
        List,
        SearchableList
    ]
})
export class DropDownList<T> {
    @Property() caretIcon = caret_down;
    
    @Property() required = false;
    @Property() active = true;
    @Property() searchableThreshold = 20;
    @Property() enableSelection = true;
    @Property() enableMultiSelection = false;
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() selectedItems: T[] = [];
    @Property() placeholder: string = '请选择...';
    @Property() labelField: string = 'label';
    @Property() labelFunction = null;
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() dropdownClass: string = '';
    @Property() dropdownOverlayClass: string = '';
    
    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
    @Emitter() selectedItemsChange: IEmitter<T[]>;
    @Emitter('item_click') itemClick: IEmitter<IItemClickEvent<T>>;
    
    @Element('trigger') trigger: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;
    
    label = this.placeholder;
    opened = false;

    invalid = false;

    onChanges() {
        this.label = this.getItemLabel();
        if (this.required) {
            if (this.enableMultiSelection) {
                if (this.dataProvider) {
                    this.invalid = !this.selectedItems || !this.selectedItems.length;
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
    }
    onClick(e) {
        if (this.enableMultiSelection) {
            this.openMultiSelectionList();
        } else {
            this.openSingleSelectctionList();
        }
    }
    openMultiSelectionList() {
        const state = {
            focus: true, // searchable
            active: this.active,
            enableMultiSelection: this.enableMultiSelection,
            dataProvider: this.dataProvider,
            selectedItems: this.selectedItems || [],
            labelField: this.labelField,
            labelFunction: this.labelFunction,
            itemRenderer: this.itemRenderer,
            onItemClick: (e) => {
                this.itemClick.emit(e);
            },
            onMultiSelectionChange: (e) => {
                this.label = this.getItemLabel();
                this.multiSelectionChange.emit(e);
                this.changeDetector.detectChanges();
            },
            onMultiSelectionItemChange: (e) => {
                state.selectedItems = e;
                this.selectedItems = e;
                this.selectedItemsChange.emit(e);
            },
        }
        const clazz: any = this._isSearchable() ? this._getSearchableListClass() : this._getListClass();
        const extraClass = this._isSearchable() ? 'ne-searchable-list-popup' : '';
        const ref = popupManager.open(clazz, {
            connectElement: this.trigger,
            popupMode: 'dropdown',
            position: 'bottomLeft',
            panelClass: `${this.dropdownClass} ne-dropdown-popup-list ${extraClass}`,
            overlayClass: this.dropdownOverlayClass,
            binding: {
                '[focus]': 'focus',
                '[active]': 'active',
                '[enableSelection]': 'true',
                '[enableMultiSelection]': 'true',
                '[dataProvider]': 'dataProvider',
                '[selectedItems]': 'selectedItems',
                '[labelField]': 'labelField',
                '[labelFunction]': 'labelFunction',
                '[itemRenderer]': 'itemRenderer',
                '(itemClick)': 'onItemClick($event)',
                '(multiSelectionChange)': 'onMultiSelectionChange($event)',
                '(selectedItemsChange)': 'onMultiSelectionItemChange($event)',
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
    openSingleSelectctionList() {
        const state = {
            focus: true, // searchable
            active: this.active,
            enableSelection: this.enableSelection,
            enableMultiSelection: false,
            dataProvider: this.dataProvider,
            selectedItem: this.selectedItem,
            labelField: this.labelField,
            labelFunction: this.labelFunction,
            itemRenderer: this.itemRenderer,
            onItemClick: (e) => {
                this.itemClick.emit(e);
                ref.close();
            },
            onSelectionChange: (e) => {
                this.label = this.getItemLabel();
                this.selectionChange.emit(e);
                this.changeDetector.detectChanges();
            },
            onSelectionItemChange: (e) => {
                state.selectedItem = e;
                this.selectedItem = e;
                this.selectedItemChange.emit(e);
            },
        }
        const clazz: any = this._isSearchable() ? this._getSearchableListClass() : this._getListClass();
        const extraClass = this._isSearchable() ? 'ne-searchable-list-popup' : '';
        const ref = popupManager.open(clazz, {
            connectElement: this.trigger,
            popupMode: 'dropdown',
            position: 'bottomLeft',
            panelClass: `${this.dropdownClass} ne-dropdown-popup-list ${extraClass}`,
            overlayClass: this.dropdownOverlayClass,
            binding: {
                '[focus]': 'focus',
                '[active]': 'active',
                '[enableSelection]': 'enableSelection',
                '[enableMultiSelection]': 'false',
                '[dataProvider]': 'dataProvider',
                '[selectedItem]': 'selectedItem',
                '[selectedIndex]': 'selectedIndex',
                '[labelField]': 'labelField',
                '[labelFunction]': 'labelFunction',
                '[itemRenderer]': 'itemRenderer',
                '(itemClick)': 'onItemClick($event)',
                '(selectionChange)': 'onSelectionChange($event)',
                '(selectedItemChange)': 'onSelectionItemChange($event)',
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
    getItemLabel() {
        if (this.enableMultiSelection) {
            if (!isDefined(this.selectedItems) || !this.selectedItems.length) {
                return this.placeholder;
            } else {
                return this.selectedItems.map(item => {
                    return this._getItemLabel(item);
                }).join(', ');
            }
        } else {
            return this._getItemLabel(this.selectedItem);
        }
    }
    protected _getListClass(): ClassLike {
        return List;
    }
    protected _getSearchableListClass(): ClassLike {
        return SearchableList;
    }
    private _isSearchable() {
        return this.dataProvider && this.dataProvider.length > this.searchableThreshold;
    }
    private _getItemLabel(item) {
        if (!isDefined(item)) {
            return this.placeholder;
        } else {
            if (this.labelFunction) return this.labelFunction(item);
            return defaultLabelFunction(item, this.labelField);
        }
    }
}
