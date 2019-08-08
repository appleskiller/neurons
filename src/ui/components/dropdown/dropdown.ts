import { UIBinding, Element, Property, Inject, Emitter } from '../../factory/decorator';
import { IUIStateStatic, IBindingDefinition, IChangeDetector, UIBindingSelector, UIBindingTemplate } from '../../compiler/common/interfaces';
import { ISVGIcon } from '../../../utils/domutils';
import { IEmitter } from '../../../helper/emitter';
import { ISelectionChangeEvent, IItemClickEvent, IItemStateStatic } from '../interfaces';
import { isDate, isDefined } from '../../../utils/typeutils';
import { BINDING_TOKENS } from '../../factory/injector';
import { IPopupOption } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk/popup/manager';
import { SvgIcon } from '../icon/svgicon';
import { caret_down } from '../icon/icons';
import { List, DefaultItemState } from '../list/list';

export interface IDropDownPopupOption<T> {
    component: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>,
    option?: IPopupOption<T>
}

@UIBinding({
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
    @Property() dropdownPanel: IUIStateStatic<T>;
    @Property() dropdownPanelBinding: IBindingDefinition;
    @Property() dropdownPanelState: T;
    @Property() label: string = '按钮';
    @Property() caretIcon = caret_down;
    @Property() openFunction: (e: MouseEvent) => IDropDownPopupOption<T> = null;
    @Element('trigger') trigger: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

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
            position: 'bottomLeft',
            binding: this.dropdownPanelBinding,
            state: this.dropdownPanelState,
            ...(openOption.option || {}),
        }
        popupOption.panelClass = popupOption.panelClass || '';
        popupOption.panelClass.indexOf('ne-dropdown-popup-panel') === -1 && (popupOption.panelClass = `ne-dropdown-popup-panel ${popupOption.panelClass}`)

        const ref = popupManager.open(dropdownPanel, popupOption as IPopupOption<T>);
        ref.onOpened.listen(() => {
            this.opened = true;
        });
        ref.onClosed.listen(() => {
            this.opened = false;
        });
    }
}

@UIBinding({
    selector: 'ne-dropdown-list',
    template: `
        <div #trigger [class]="{'ne-dropdown-list-trigger': true, 'opened': opened}" [title]="label" (click)="onClick($event)">
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
            background-color: rgba(125, 125, 125, 0.12);
            transition: background-color 280ms cubic-bezier(.4,0,.2,1);
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
            max-width: 320px;
            line-height: 24px;
        }
        .ne-dropdown-popup-list .ne-list.enable-selection .ne-list-item.selected {
            background-color: rgba(26, 115, 232, 1);
            color: rgba(255,255,255,0.8);
        }
    `,
    requirements: [
        SvgIcon,
        List
    ]
})
export class DropDownList<T> {
    @Property() caretIcon = caret_down;
    
    @Property() active = true;
    @Property() enableSelection = true;
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T = undefined;
    @Property() labelField: string = 'label';
    @Property() labelFunction = null;
    @Property() itemRenderer: IItemStateStatic<T> = DefaultItemState;
    @Property() dropdownClass: string = '';
    @Property() dropdownOverlayClass: string = '';

    label = '请选择...';
    opened = false;

    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter('item_click') itemClick: IEmitter<IItemClickEvent<T>>;

    @Element('trigger') trigger: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    onChanges() {
        this.label = this.getItemLabel();
    }
    onClick(e) {
        const state = {
            active: this.active,
            enableSelection: this.enableSelection,
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
        const ref = popupManager.open(List, {
            connectElement: this.trigger,
            popupMode: 'dropdown',
            position: 'bottomLeft',
            panelClass: `${this.dropdownClass} ne-dropdown-popup-list`,
            overlayClass: this.dropdownOverlayClass,
            binding: {
                '[active]': 'active',
                '[enableSelection]': 'enableSelection',
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
        if (!isDefined(this.selectedItem)) {
            return '请选择...';
        } else {
            if (this.labelFunction) return this.labelFunction(this.selectedItem);
            if (isDate(this.selectedItem)) {
                return this.selectedItem.toLocaleString();
            } else if (typeof this.selectedItem === 'object' && this.labelField) {
                return this.selectedItem[this.labelField];   
            } else {
                return this.selectedItem;
            }
        }
    }
}
