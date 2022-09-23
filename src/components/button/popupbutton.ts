
import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { IUIStateStatic, IBindingDefinition, IChangeDetector, BindingSelector, BindingTemplate, IBindingRef, StateObject } from '../../binding/common/interfaces';
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
import { asPromise, isDefined, isObservabeLike, isPromiseLike } from 'neurons-utils';
import { ClassLike } from 'neurons-injector';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';
import { Button } from './button';

export interface IPopupButtonOption extends IPopupOption<any> {

}

@Binding({
    selector: 'ne-popup-button',
    template: `
        <ne-button
            class="ne-popup-button"
            [mode]="mode"
            [disabled]="disabled"
            [color]="color"
            [class.opened]="_opened"
            [class.invalid]="invalid"
            [class.hide-icon]="!caretIcon"
            [class.hide-label]="!!hideLabel"
            [class.before-position-caret]="caretPosition === 'before'"
            [readonly]="readonly ? '' : null"
            (click)="onClick($event)"
        >
            <div *if="!hideLabel" class="ne-popup-button-label">{{label || placeholder}}</div>
            <ne-icon *if="caretIcon" class="ne-popup-button-icon" [icon]="caretIcon"></ne-icon>
        </ne-button>
    `,
    style: `
        .ne-popup-button {
            display: inline-block;
            position: relative;
            padding: 4px 32px 4px 12px;
            cursor: pointer;
            user-select: none;
            border: solid 1px transparent;
            border-radius: 3px;
            background-color: rgba(125, 125, 125, 0.12);
            box-sizing: border-box;
            .ne-popup-button-icon {
                position: absolute;
                top: 0px;
                bottom: 0px;
                left: initial;
                right: 8px;
                width: initial;
                height: 22px;
                margin: auto;
            }
            &.opened {
                background-color: rgba(125, 125, 125, 0.24);
            }
            &.invalid {
                border-color: ${theme.color.error};
            }
            &.before-position-caret {
                padding: 4px 12px 4px 32px;
                .ne-popup-button-icon {
                    left: 8px;
                    right: initial;
                }
            }
            &.hide-icon {
                padding-left: 12px;
                padding-right: 12px;
            }
            &.hide-label {
                padding-left: 8px;
                padding-right: 8px;
                .ne-popup-button-icon {
                    position: relative;
                    left: initial;
                    right: initial;
                }
            }
        }
    `,
    requirements: [
        SvgIcon,
        Button
    ]
})
export class PopupButton {
    @Property() disabled: boolean = false;
    @Property() color: 'basic' | 'primary' = 'basic';
    @Property() mode: 'basic' | 'raised' | 'stroked' | 'flat' | 'simulated' = 'basic';

    @Property() caretPosition: 'before' | 'after' = 'after';
    @Property() caretIcon = caret_down;
    @Property() invalid: boolean = false;
    @Property() readonly: boolean = false;
    @Property() hideLabel: boolean = false;
    @Property() label = '';
    @Property() placeholder: string = '请选择...';

    @Property() popupOption: IPopupButtonOption;
    @Property() openFunction: (container: HTMLElement, popupRef: IPopupRef<any>) => IBindingRef<any> | Promise<IBindingRef<any>> | ObservableLike<IBindingRef<any>>;

    @Emitter() opened: IEmitter<void>;
    @Emitter() closed: IEmitter<void>;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    _opened = false;

    private _popupRef: IPopupRef<any>;
    private _destroyed;

    onChanges(changes) {
    }
    onDestroy() {
        this._destroyed = true;
        this._popupRef && this._popupRef.close();
    }
    onClick(e: MouseEvent) {
        if (this.disabled || this.readonly) return;
        this._popupRef && this._popupRef.close();
        const container = createElement('div', 'ne-popup-button-panel');
        let innerPanel: IBindingRef<any>;
        const popupOption = this.popupOption || {};
        const onBeforeOpen = popupOption.onBeforeOpen;
        const ref = popupManager.open(container, {
            ...popupOption,
            connectElement: popupOption.connectElement || e.currentTarget as HTMLElement,
            panelClass: `ne-popup-button-popup ${popupOption.panelClass || ''}`,
            overlayClass: `ne-popup-button-overlay ${popupOption.overlayClass || ''}`,
            popupMode: popupOption.popupMode || 'modal',
            position: popupOption.position || 'center',
            onBeforeOpen: (popupRef: IPopupRef<any>) => {
                if (this._destroyed) return;
                const ret = this.openFunction ? this.openFunction(container, popupRef) : null;
                if (isObservabeLike(ret) || isPromiseLike(ret)) {
                    return asPromise(ret).then(panel => {
                        if (this._destroyed) return;
                        ref && ref.updatePosition();
                        innerPanel = panel;
                    });
                } else {
                    innerPanel = ret as IBindingRef<any>;
                }
                onBeforeOpen && onBeforeOpen(popupRef);
            }
        });
        ref.onOpened.listen(() => {
            this._opened = true;
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
