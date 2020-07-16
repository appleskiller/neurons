import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { IUIStateStatic, IBindingDefinition, IChangeDetector, BindingSelector, BindingTemplate, IBindingRef } from '../../binding/common/interfaces';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { createElement } from 'neurons-dom';
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

@Binding({
    selector: 'ne-dropdown-trigger',
    template: `
        <div #trigger [class]="{'ne-dropdown-trigger': true, 'opened': _opened, 'invalid': invalid}" [title]="label || placeholder" (click)="onClick($event)">
            <div class="ne-dropdown-trigger-inffix"><div>{{label || placeholder}}</div></div>
            <ne-icon class="ne-dropdown-trigger-icon" [icon]="caretIcon"></ne-icon>
        </div>
    `,
    style: `
        .ne-dropdown-trigger {
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
        .ne-dropdown-trigger:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
        .ne-dropdown-trigger.opened,
        .ne-dropdown-trigger:active {
            background-color: rgba(125, 125, 125, 0.24);
        }
        .ne-dropdown-trigger .ne-dropdown-trigger-icon {
            position: absolute;
            top: 0px;
            bottom: 0px;
            right: 4px;
            width: initial;
            margin: auto;
        }
        .ne-dropdown-trigger .ne-dropdown-trigger-inffix {
            padding: 0 18px 0 10px;
        }
        .ne-dropdown-trigger .ne-dropdown-trigger-inffix > div {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
    `,
    requirements: [
        SvgIcon,
    ]
})
export class DropDownTrigger<T> {
    @Property() caretIcon = caret_down;
    @Property() label = '';
    @Property() placeholder: string = '请选择...';
    @Property() openFunction: (container: HTMLElement, popupRef: IPopupRef<any>) => IBindingRef<any>;
    
    @Property() panelClass: string = '';
    @Property() position: string = '';
    @Property() hasOverlay: boolean;
    @Property() overlayClass: string = '';
    @Property() overlayBackgroundColor: string;
    @Property() autoClose: boolean;
    @Property() disableClose: boolean;
    @Property() width: number | string;
    @Property() height: number | string;

    @Emitter() opened: IEmitter<void>;
    @Emitter() closed: IEmitter<void>;

    @Element('trigger') trigger: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    _opened = false;

    private _popupRef: IPopupRef<any>;

    onChanges() {
        
    }
    onDestroy() {
        this._popupRef && this._popupRef.close();
    }
    onClick(e) {
        this._popupRef && this._popupRef.close();
        const container = createElement('div', 'ne-dropdown-trigger-panel');
        const ref = popupManager.open(container, {
            connectElement: this.trigger,
            panelClass: `ne-dropdown-trigger-popup ${this.panelClass || ''}`,
            overlayClass: `ne-dropdown-trigger-overlay ${this.overlayClass || ''}`,
            popupMode: 'dropdown',
            position: this.position,
            hasOverlay: this.hasOverlay,
            overlayBackgroundColor: this.overlayBackgroundColor,
            autoClose: this.autoClose,
            disableClose: this.disableClose,
            width: this.width,
            height: this.height,
        });
        let innerPanel: IBindingRef<any>;
        ref.onOpened.listen(() => {
            this._opened = true;
            innerPanel = this.openFunction ? this.openFunction(container, ref) : null;
            this.opened.emit();
            ref.updatePosition();
            this.changeDetector.detectChanges();
        });
        ref.onClosed.listen(() => {
            this._opened = false;
            this.closed.emit();
            if (innerPanel && 'destroy' in innerPanel && typeof innerPanel.destroy === 'function') {
                innerPanel.destroy();
            }
            this.changeDetector.detectChanges();
        });
        this._popupRef = ref;
    }
}
