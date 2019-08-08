
import { IEmitter } from '../../../helper/emitter';
import { ISVGIcon, insertBefore, insert } from '../../../utils/domutils';
import { Property, UIBinding, Element, Emitter } from '../../factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check, radio_check, radio_uncheck, check, empty_icon } from '../icon/icons';

const icons = {
    checkbox: {
        check: checkbox_check,
        uncheck: checkbox_uncheck,
    },
    radio: {
        check: radio_check,
        uncheck: radio_uncheck,
    },
    check: {
        check: check,
        uncheck: empty_icon,
    },
}

@UIBinding({
    selector: 'ne-check-item',
    template: `
        <div [class]="{'ne-check-item': true, 'checked': checked, 'disabled': disabled}"
            [check-style]="checkStyle"
            [check-position]="checkPosition"
            (click)="onClicked($event)"
        >
            <div #container class="ne-check-item-inffix">
                <span #iconDom class="ne-check-item-icon">
                    <ne-icon class="uncheck-icon" [icon]="uncheckIcon"></ne-icon>
                    <ne-icon class="check-icon" [icon]="checkIcon"></ne-icon>
                </span>
                <content/>
            </div>
        </div>
    `,
    style: `
        .ne-check-item {
            padding: 0 6px;
            font-size: 14px;
            line-height: 22px;
            cursor: pointer;
            user-select: none;
        }
        .ne-check-item:hover {
            background-color: rgba(125, 125, 125, 0.12);
        }
        .ne-check-item .ne-check-item-inffix {
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
        }
        .ne-check-item .ne-check-item-icon {
            position: relative;
            margin-left: 0;
            margin-right: 6px;
        }
        .ne-check-item[check-position=after] .ne-check-item-icon {
            margin-right: 0;
            margin-left: 6px;
        }
        .ne-check-item .ne-check-item-icon > .ne-icon {
            width: initial;
            height: initial;
            transition: opacity 280ms cubic-bezier(.4,0,.2,1), color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-check-item .ne-check-item-icon > .ne-icon svg {
            padding-bottom: 2px;
        }
        .ne-check-item .ne-check-item-icon .uncheck-icon {
            opacity: 1;
            color: rgba(126, 126, 126, 0.5);
        }
        .ne-check-item .ne-check-item-icon .check-icon {
            position: absolute;
            left: 0;
            opacity: 0;
            color: rgba(26, 115, 232, 1);
        }
        .ne-check-item.checked .ne-check-item-icon .uncheck-icon {
            opacity: 0;
        }
        .ne-check-item.checked .ne-check-item-icon .check-icon {
            opacity: 1;
        }
        .ne-check-item.disabled {
            opacity: 0.24;
            cursor: default;
        }
        .ne-check-item[check-style=check_edge] .ne-check-item-icon {
            display: none;
        }
        .ne-check-item[check-style=check_edge][check-position=before] {
            border-left: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=check_edge][check-position=before] {
            border-left: solid 4px rgba(26, 115, 232, 1);
        }
        .ne-check-item[check-style=check_edge][check-position=after] {
            border-right: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=check_edge][check-position=after] {
            border-right: solid 4px rgba(26, 115, 232, 1);
        }
        .ne-check-item[check-style=capsule] {
            border-radius: 120px;
            background-color: rgba(125, 125, 125, 0.12);
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=capsule] {
            background-color: rgba(26, 115, 232, 1);
            color: rgba(255, 255, 255, 1);
        }
        .ne-check-item[check-style=capsule] .ne-check-item-icon {
            display: none;
        }
        .ne-check-item[check-style=highlight_text] {
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=highlight_text] {
            color: rgba(26, 115, 232, 1);
        }
        .ne-check-item[check-style=highlight_text] .ne-check-item-icon {
            display: none;
        }
        .ne-check-item[check-style=highlight_background] {
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=highlight_background] {
            background-color: rgba(26, 115, 232, 1);
            color: rgba(255, 255, 255, 1);
        }
        .ne-check-item[check-style=highlight_background] .ne-check-item-icon {
            display: none;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class CheckItem {
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkMode: 'multi' | 'single' = 'multi';
    @Property() checkStyle: 'checkbox' | 'radio' | 'check' | 'highlight' | 'background' | 'capsule' = 'check';
    @Property() checkPosition: 'before' | 'after' = 'before';

    @Element('container') container: HTMLElement;
    @Element('iconDom') iconDom: HTMLElement;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;

    checkIcon = empty_icon;
    uncheckIcon = empty_icon;

    onChanges(changes) {
        if (!changes || 'checkStyle' in changes) {
            if (icons[this.checkStyle]) {
                this.checkIcon = icons[this.checkStyle].check;
                this.uncheckIcon = icons[this.checkStyle].uncheck;
            } else {
                this.checkIcon = empty_icon;
                this.uncheckIcon = empty_icon;
            }
        }
        if (!changes || 'checkPosition' in changes) {
            if (this.checkPosition === 'before') {
                insert(this.container, this.iconDom);
            } else {
                this.container.appendChild(this.iconDom);
            }
        }
    }
    
    onClicked(e) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            if (this.checkMode === 'single') {
                if (!this.checked) {
                    this.checked = true;
                    this.checkedChange.emit(this.checked);
                    this.change.emit(this.checked);
                }
            } else {
                this.checked = !this.checked;
                this.checkedChange.emit(this.checked);
                this.change.emit(this.checked);
            }
        }
    }
}