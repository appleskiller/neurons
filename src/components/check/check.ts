
import { Property, Binding, Element, Emitter } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check, radio_check, radio_uncheck, check, empty_icon } from '../icon/icons';
import { theme } from '../style/theme';
import { IEmitter } from 'neurons-emitter';
import { insert } from 'neurons-dom';
import { ISVGIcon } from 'neurons-dom/dom/element';

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

@Binding({
    selector: 'ne-check-item',
    template: `
        <div [class]="{'ne-check-item': true, 'checked': checked, 'disabled': disabled}"
            [check-style]="checkStyle"
            [check-position]="checkPosition"
            (click)="onClicked($event)"
        >
            <div #container class="ne-check-item-inffix">
                <span #iconDom class="ne-check-item-icon">
                    <ne-icon class="check-icon" [icon]="icon"></ne-icon>
                </span>
                <span><content/></span>
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
            border: transparent;
            transition: ${theme.transition.normal('border', 'color', 'background-color')};
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

        .ne-check-item .ne-check-item-icon .check-icon {
            opacity: 1;
            color: rgba(125, 125, 125, 0.5);
        }
        .ne-check-item.checked .ne-check-item-icon .check-icon{
            color: ${theme.color.primary};
        }

        .ne-check-item.disabled {
            opacity: 0.24;
            cursor: default;
        }

        .ne-check-item[check-style=edge] .ne-check-item-icon {
            display: none;
        }
        .ne-check-item[check-style=edge][check-position=before] {
            border-left: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=edge][check-position=before] {
            border-left: solid 4px ${theme.color.primary};
        }
        .ne-check-item[check-style=edge][check-position=after] {
            border-right: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=edge][check-position=after] {
            border-right: solid 4px ${theme.color.primary};
        }

        .ne-check-item[check-style=v-edge] .ne-check-item-icon {
            display: none;
        }
        .ne-check-item[check-style=v-edge][check-position=before] {
            border-top: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=v-edge][check-position=before] {
            border-top: solid 4px ${theme.color.primary};
        }
        .ne-check-item[check-style=v-edge][check-position=after] {
            border-bottom: solid 4px transparent;
        }
        .ne-check-item.checked[check-style=v-edge][check-position=after] {
            border-bottom: solid 4px ${theme.color.primary};
        }

        .ne-check-item[check-style=capsule] {
            border-radius: 120px;
            background-color: rgba(125, 125, 125, 0.12);
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=capsule] {
            background-color: ${theme.color.primary};
            color: rgba(255, 255, 255, 1);
        }
        .ne-check-item[check-style=capsule] .ne-check-item-icon {
            display: none;
        }

        .ne-check-item[check-style=highlight] {
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=highlight] {
            color: ${theme.color.primary};
        }
        .ne-check-item[check-style=highlight] .ne-check-item-icon {
            display: none;
        }

        .ne-check-item[check-style=background] {
            padding: 0 12px;
        }
        .ne-check-item.checked[check-style=background] {
            background-color: ${theme.color.primary};
            color: rgba(255, 255, 255, 1);
        }
        .ne-check-item[check-style=background] .ne-check-item-icon {
            display: none;
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class CheckItem {
    @Property() readonly = false;
    @Property() disabled = false;
    @Property() checked = false;
    @Property() checkMode: 'multi' | 'single' = 'multi';
    @Property() checkStyle: 'checkbox' | 'radio' | 'check' | 'highlight' | 'background' | 'capsule' | 'edge' | 'v-edge'= 'check';
    @Property() checkPosition: 'before' | 'after' = 'before';

    @Element('container') container: HTMLElement;
    @Element('iconDom') iconDom: HTMLElement;

    @Emitter() checkedChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<boolean>;

    checkIcon = empty_icon;
    uncheckIcon = empty_icon;
    icon;

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
        if (!changes || 'checked' in changes || 'checkStyle' in changes) {
            this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
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
        if (this.disabled || this.readonly) {
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
            this.icon = this.checked ? this.checkIcon : this.uncheckIcon;
        }
    }
}