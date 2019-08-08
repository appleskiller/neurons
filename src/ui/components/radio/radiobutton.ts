import { UIBinding, Property, Emitter } from '../../factory/decorator';
import { ISVGIcon } from '../../../utils/domutils';
import { StateChanges } from '../../compiler/common/interfaces';
import { IEmitter } from '../../../helper/emitter';
import { SvgIcon } from '../icon/svgicon';
import { radio_check, radio_uncheck } from '../icon/icons';

@UIBinding({
    selector: 'ne-radio-button',
    template: `
        <div [class]="{'ne-radio-button': true, 'checked': checked, 'disabled': disabled}" (click)="onClicked($event)">
            <div class="ne-radio-inffix">
                <span class="ne-radio-icon">
                    <ne-icon class="uncheck-icon" [icon]="uncheckIcon"></ne-icon>
                    <ne-icon class="check-icon" [icon]="checkIcon"></ne-icon>
                </span>
                <content/>
            </div>
        </div>
    `,
    style: `
        .ne-radio-button {
            padding: 0 6px;
            font-size: 14px;
            line-height: 22px;
        }
        .ne-radio-button .ne-radio-inffix {
            position: relative;
            cursor: pointer;
            user-select: none;
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
        .ne-radio-button .ne-radio-icon > .ne-icon svg {
            padding-bottom: 2px;
        }
        .ne-radio-button .ne-radio-icon .uncheck-icon {
            opacity: 1;
            color: rgba(126, 126, 126, 0.5);
        }
        .ne-radio-button .ne-radio-icon .check-icon {
            position: absolute;
            left: 0;
            opacity: 0;
            color: rgba(26, 115, 232, 1);
        }
        .ne-radio-button.checked .ne-radio-icon .uncheck-icon {
            opacity: 0;
        }
        .ne-radio-button.checked .ne-radio-icon .check-icon {
            opacity: 1;
        }
        .ne-radio-button.disabled {
            opacity: 0.24;
            color: rgba(0, 0, 0, 0.8);
            cursor: default;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class RadioButton {
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkIcon = radio_check;
    @Property() uncheckIcon = radio_uncheck;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;
    
    onClicked(e) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            if (!this.checked) {
                this.checked = true;
                this.checkedChange.emit(this.checked);
                this.change.emit(this.checked);
            }
        }
    }
}

