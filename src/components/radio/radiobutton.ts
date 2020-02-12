import { Binding, Property, Emitter } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { StateChanges } from '../../binding/common/interfaces';
import { SvgIcon } from '../icon/svgicon';
import { radio_check, radio_uncheck } from '../icon/icons';
import { theme } from '../style/theme';

@Binding({
    selector: 'ne-radio-button',
    template: `
        <div [class]="{'ne-radio-button': true, 'checked': checked, 'disabled': disabled, 'readonly': readonly}" (click)="onClicked($event)">
            <div class="ne-radio-inffix">
                <span class="ne-radio-icon">
                    <ne-icon class="check-icon" [icon]="icon"></ne-icon>
                </span>
                <content/>
            </div>
        </div>
    `,
    style: `
        .ne-radio-button {
            padding: 0 6px;
            font-size: inherit;
            cursor: pointer;
            user-select: none;
        }
        .ne-radio-button .ne-radio-inffix {
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
        .ne-radio-button .ne-radio-icon {
            margin-right: 6px;
        }
        .ne-radio-button .ne-radio-icon > .ne-icon {
            width: initial;
            height: initial;
            transition: opacity 280ms cubic-bezier(.4,0,.2,1), color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-radio-button .ne-radio-icon .check-icon {
            opacity: 1;
            color: rgba(125, 125, 125, 0.5);
        }
        .ne-radio-button.checked .ne-radio-icon .check-icon {
            color: ${theme.color.primary};
        }
        .ne-radio-button.disabled {
            opacity: 0.24;
            cursor: default;
        }
        .ne-radio-button.readonly {
            cursor: default;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class RadioButton {
    @Property() readonly = false;
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkIcon = radio_check;
    @Property() uncheckIcon = radio_uncheck;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;

    icon;

    onChanges(changes) {
        if (!changes || 'checked' in changes || 'checkIcon' in changes || 'uncheckIcon' in changes) {
            this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
        }
    }
    
    onClicked(e) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            if (!this.checked) {
                this.checked = true;
                this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
                this.checkedChange.emit(this.checked);
                this.change.emit(this.checked);
            }
        }
    }
}

