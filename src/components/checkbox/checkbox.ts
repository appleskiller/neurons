import { IEmitter } from 'neurons-emitter';
import { Property, Binding, Emitter } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check } from '../icon/icons';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';

@Binding({
    selector: 'ne-check-box',
    template: `
        <div [class]="{'ne-check-box': true, 'checked': checked, 'disabled': disabled, 'readonly': readonly}" (click)="onClicked($event)">
            <div class="ne-check-box-inffix">
                <span class="ne-check-box-icon">
                    <ne-icon class="check-icon" [icon]="icon"></ne-icon>
                </span>
                <content/>
            </div>
        </div>
    `,
    style: `
        .ne-check-box {
            padding: 0 6px;
            font-size: inherit;
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
        .ne-check-box .ne-check-box-icon .check-icon {
            opacity: 1;
            color: rgba(125, 125, 125, 0.5);
        }
        .ne-check-box.checked .ne-check-box-icon .check-icon{
            color: ${theme.color.primary};
        }
        .ne-check-box.disabled {
            opacity: 0.24;
            cursor: default;
        }
        .ne-check-box.readonly {
            cursor: default;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class CheckBox {
    @Property() readonly = false;
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkIcon = checkbox_check;
    @Property() uncheckIcon = checkbox_uncheck;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;

    icon;

    onChanges(changes) {
        if (!changes || 'checked' in changes || 'checkIcon' in changes || 'uncheckIcon' in changes) {
            this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
        }
    }

    onClicked(e) {
        if (this.disabled || this.readonly) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            this.checked = !this.checked;
            this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
            this.checkedChange.emit(this.checked);
            this.change.emit(this.checked);
        }
    }
}