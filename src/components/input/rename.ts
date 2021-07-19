import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { addEventListener, getCursorSelection, getCursorRange, replaceCursorTextRange } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { theme } from '../style/theme';
import { IChangeDetector, StateChanges } from '../../binding/common/interfaces';
import { Input } from './input';
import { SvgIcon } from '../icon/svgicon';
import { edit } from '../icon/icons';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk';
import { BINDING_TOKENS } from '../../binding';

@Binding({
    selector: 'ne-rename-input',
    template: `
        <div class="ne-rename-input ne-rename-input-label"
            #renameInput
            [class.invalid]="invalid"
            [disabled]="isDisabled()"
            [readonly]="isReadonly()"
            [style.opacity]="opened ? '0' : '1'"
            (click)="onNameClick($event);"
        >
            <div class="ne-rename-input-label-name">{{getName()}}</div>
            <ne-icon [icon]="editIcon"></ne-icon>
        </div>
    `,
    style: `
        .ne-rename-input-label {
            padding-left: 8px;
            padding-right: 8px;
            height: 100%;
            position: relative;
            cursor: pointer;
            user-select: none;
            transition: ${theme.transition.normal('color')};
            &.invalid {
                color: ${theme.color.error};
            }

            .ne-rename-input-label-name {
                display: inline-block;
                vertical-align: middle;
                max-width: 100%;
            }
            .ne-icon {
                display: inline-block;
                vertical-align: middle;
                width: 24px;
                text-align: right;
                color: ${theme.color.primary};
                opacity: 0;
                transition: ${theme.transition.normal('opacity')};
                margin-top: -2px;
            }
            &:not([readonly]):hover {
                .ne-rename-input-label-name {
                    max-width: calc(100% - 24px);
                }
                .ne-icon {
                    opacity: 1;
                }
            }
            &[readonly] {
                cursor: inherit;
                .ne-icon {
                    opacity: 0;
                }
            }
            &[disabled] {
                cursor: inherit;
                .ne-icon {
                    opacity: 0;
                }
            }
        }
        .ne-rename-input-popup {
            .ne-popup-panel-content {
                box-shadow: none;
                background-color: rgba(0,0,0,0) !important;
                border-radius: 0;
                .ne-rename-input-panel {
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    position: relative;
                    border-bottom: solid 2px ${theme.color.primary};
                    .ne-input {
                        width: 100%;
                        padding: 0;
                        border: none;
                        border-radius: 0;
                    }
                }
            }
        }
    `,
    requirements: [
        Input,
        SvgIcon
    ]
})
export class RenameInput {
    @Property() name: string = '';
    @Property() nameMaxLength: number = 64;
    @Property() disabled: boolean = false;
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() placeholder: string = '请输入...';

    @Element('renameInput') renameInput: HTMLElement;

    @Emitter() nameChange: IEmitter<string>;
    @Emitter() change: IEmitter<string>;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    invalid = false;
    opened = false;
    editIcon = edit;
    popupRef: IPopupRef<any>;

    onChanges(changes) {
        if (!changes || 'name' in changes || 'required' in changes) {
            this.invalid = this.required ? !this.name : false;
        }
    }
    onDestroy() {
        this.popupRef && this.popupRef.close();
    }
    protected getName() {
        return this.name || this.placeholder;
    }
    protected onNameClick(event: MouseEvent) {
        this.showEdit();
    }
    protected isDisabled() {
        return this.disabled ? '' : undefined;
    }
    protected isReadonly() {
        return this.readonly ? '' : undefined;
    }
    protected showEdit() {
        if (this.readonly || this.disabled) return;
        this.popupRef && this.popupRef.close();
        this.opened = true;
        const state = this._getRenamePopupData();
        Object.assign(state, {
            focus: true,
            onEnter: () => {
                this.popupRef.close();
            },
            onEsc: () => {
                state.name = this.name;
            }
        });
        const box = this.renameInput.getBoundingClientRect();
        this.popupRef = popupManager.open(`
            <div class="ne-rename-input-panel"
                [style.font]="font"
                [style.padding]="padding"
                [style.margin]="margin"
                [style.lineHeight]="lineHeight"
            >
                <ne-input [maxlength]="nameMaxLength" [(value)]="name" (enterPressed)="onEnter()" (escPressed)="onEsc()" [focus]="focus" [selected]="true"></ne-input>
            </div>
        `, {
            popupMode: 'dropdown',
            panelClass: 'ne-rename-input-popup',
            disableAnimation: true,
            disableFadeInOut: true,
            position: 'center',
            connectElement: this.renameInput,
            overlayBackgroundColor: 'rgba(0,0,0,0)',
            width: box.width,
            height: box.height,
            state: state,
        });
        this.popupRef.onClose.listen(() => {
            this.opened = false;
            const newName = state.name.trim();
            if (newName && this.name !== newName) {
                this.name = newName;
                this.nameChange.emit(this.name);
                this.invalid = this.required ? !this.name : false;
                this.change.emit();
            }
            this.cdr.detectChanges();
        })
    }
    protected _getRenamePopupData() {
        const stl = document.defaultView.getComputedStyle(this.renameInput);
        return {
            name: this.name,
            nameMaxLength: this.nameMaxLength,
            font: stl.font,
            padding: stl.padding,
            margin: stl.margin,
            lineHeight: stl.lineHeight,
        }
    }
}


