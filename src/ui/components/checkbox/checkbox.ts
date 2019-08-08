import { IEmitter } from '../../../helper/emitter';
import { ISVGIcon } from '../../../utils/domutils';
import { Property, UIBinding, Emitter } from '../../factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check } from '../icon/icons';

@UIBinding({
    selector: 'ne-check-box',
    template: `
        <div [class]="{'ne-check-box': true, 'checked': checked, 'disabled': disabled}" (click)="onClicked($event)">
            <div class="ne-check-box-inffix">
                <span class="ne-check-box-icon">
                    <ne-icon class="uncheck-icon" [icon]="uncheckIcon"></ne-icon>
                    <ne-icon class="check-icon" [icon]="checkIcon"></ne-icon>
                </span>
                <content/>
            </div>
        </div>
    `,
    style: `
        .ne-check-box {
            padding: 0 6px;
            font-size: 14px;
            line-height: 22px;
            cursor: pointer;
            user-select: none;
        }
        .ne-check-box .ne-check-box-inffix {
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
        .ne-check-box .ne-check-box-icon {
            margin-right: 6px;
        }
        .ne-check-box .ne-check-box-icon > .ne-icon {
            width: initial;
            height: initial;
            transition: opacity 280ms cubic-bezier(.4,0,.2,1), color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-check-box .ne-check-box-icon > .ne-icon svg {
            padding-bottom: 2px;
        }
        .ne-check-box .ne-check-box-icon .uncheck-icon {
            opacity: 1;
            color: rgba(126, 126, 126, 0.5);
        }
        .ne-check-box .ne-check-box-icon .check-icon {
            position: absolute;
            left: 0;
            opacity: 0;
            color: rgba(26, 115, 232, 1);
        }
        .ne-check-box.checked .ne-check-box-icon .uncheck-icon {
            opacity: 0;
        }
        .ne-check-box.checked .ne-check-box-icon .check-icon {
            opacity: 1;
        }
        .ne-check-box.disabled {
            opacity: 0.24;
            cursor: default;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class CheckBox {
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkIcon = checkbox_check;
    @Property() uncheckIcon = checkbox_uncheck;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;
    
    onClicked(e) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            this.checked = !this.checked;
            this.checkedChange.emit(this.checked);
            this.change.emit(this.checked);
        }
    }
}