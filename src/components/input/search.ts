import { Binding, Property, Element, Emitter } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { Input } from './input';
import { SvgIcon } from '../icon/svgicon';
import { times, search } from '../icon/icons';
import { theme } from '../style/theme';

@Binding({
    selector: 'ne-search-input',
    template: `
        <div [class]="{'ne-search-input': true, 'focused': focus, 'collapsible': collapsible, 'expanded': expanded, 'readonly': readonly, 'disabled': disabled}" (click)="onHostClick($event)">
            <ne-icon
                class="ne-search-input-prefix ne-search-icon"
                [icon]="searchIcon"
                (click)="focus = true;"
            />
            <div class="ne-search-input-inffix">
                <div class="ne-search-input-inffix-content">
                    <ne-input
                        [(value)]="value"
                        [name]="name"
                        [placeholder]="(!collapsible || expanded) ? placeholder : ''"
                        [readonly]="readonly"
                        [required]="required"
                        [disabled]="disabled"
                        [(focus)]="focus"
                        (change)="onInputChange()"
                        (enterPressed)="enterPressed.emit($event)"
                    ></ne-input>
                </div>
            </div>
            <ne-icon
                [class]="{'ne-search-input-suffix': true, 'ne-clear-icon': true, 'show': showClear}"
                [icon]="timesIcon"
                (click)="onClearClick($event)"
            />
        </div>
    `,
    style: `
        .ne-search-input {
            position: relative;
            line-height: 26px;
            border-bottom: solid 1px rgba(125, 125, 125, 0);
            transition: border-bottom 280ms cubic-bezier(.4,0,.2,1), width 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-search-input.disabled {
            opacity: 0.3;
        }
        .ne-search-input:not(.disabled):hover {
            border-bottom: solid 1px rgba(125, 125, 125, 0.24);
        }
        .ne-search-input:not(.readonly).focused {
            border-bottom: solid 1px ${theme.color.primary};
        }
        .ne-search-input .ne-search-input-prefix,
        .ne-search-input .ne-search-input-inffix,
        .ne-search-input .ne-search-input-suffix {
            display: inline-block;
            vertical-align: middle;
        }
        .ne-search-input .ne-search-input-prefix,
        .ne-search-input .ne-search-input-suffix {
            width: 24px;
            height: 100%;
            text-align: center;
            position: absolute;
            top: 0;
        }
        .ne-search-input .ne-search-input-prefix {
            left: 0;
        }
        .ne-search-input .ne-search-input-suffix {
            right: 0;
        }
        .ne-search-input.focused .ne-search-input-suffix {
        }
        .ne-search-input .ne-search-icon {
            transition: color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-search-input .ne-clear-icon {
            opacity: 0;
            transition: color 280ms cubic-bezier(.4,0,.2,1), opacity 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-search-input .ne-clear-icon.show {
            opacity: 1;
            cursor: pointer;
            transition: color 280ms cubic-bezier(.4,0,.2,1), opacity 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-search-input .ne-clear-icon.show:hover {
            color: rgba(244, 67, 54, 1);
        }
        .ne-search-input .ne-search-input-inffix {
            width: 100%;
        }
        .ne-search-input .ne-search-input-inffix .ne-search-input-inffix-content {
            padding: 0 24px;
        }
        .ne-search-input .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            display: block;
            width: 100%;
            height: 100%;
            padding: 0;
            border: none;
        }
        .ne-search-input .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            cursor: pointer;
        }
        .ne-search-input.focused .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            cursor: text;
        }
        .ne-search-input.readonly .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            cursor: default;
        }
        .ne-search-input.disabled .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            cursor: default;
        }
        .ne-search-input.disabled.focused .ne-search-input-inffix .ne-search-input-inffix-content .ne-input {
            cursor: default;
        }
        .ne-search-input.collapsible {
            width: 24px;
            cursor: pointer;
        }
        .ne-search-input.collapsible:not(.expanded) .ne-search-icon:hover {
            color: ${theme.color.primary};
        }
        .ne-search-input.collapsible .ne-clear-icon {
            display: none;
        }
        .ne-search-input.collapsible:hover {
            border-bottom: solid 1px rgba(125, 125, 125, 0);
        }
        .ne-search-input.collapsible.focused {
            border-bottom: solid 1px ${theme.color.primary};
        }
        .ne-search-input.collapsible.expanded {
            width: 100%;
            cusor: default;
        }
        .ne-search-input.collapsible.expanded .ne-clear-icon {
            display: inline-block;
        }
    `,
    requirements: [
        Input,
        SvgIcon
    ]
})
export class SearchInput {
    @Property() value: string = '';
    @Property() name: string = '';
    @Property() placeholder: string = '搜索...';
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() disabled: boolean = false;
    @Property() focus: boolean = false;
    @Property() collapsible: boolean = false;
    @Property() expanded: boolean = false;
    @Property() searchIcon: ISVGIcon = search;
    @Property() timesIcon: ISVGIcon = times;

    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() valueChange: IEmitter<string>;
    @Emitter() change: IEmitter<void>;
    @Emitter() focusChange: IEmitter<boolean>;
    @Emitter() expandedChange: IEmitter<boolean>;

    showClear: boolean = false;
    
    onInputChange() {
        this.change.emit();
        if (!this.collapsible) {
            this.showClear = !!this.value;
        }
    }
    onClearClick(e: MouseEvent) {
        if (this.value !== '') {
            this.value = '';
            this.valueChange.emit(this.value);
            let focus;
            if (this.collapsible) {
                focus = false;
            } else {
                focus = true;
            }
            if (this.focus !== focus) {
                this.focus = focus;
                this.focusChange.emit();
            }
            this.showClear = false;
            this.change.emit();
        }
        if (this.collapsible) {
            if (this.expanded !== false) {
                this.expanded = false;
                if (this.focus !== false) {
                    this.focus = false;
                    this.focusChange.emit();
                }
                this.expandedChange.emit(this.expanded);
            }
            e.preventDefault();
        }
    }
    onHostClick(e: MouseEvent) {
        if (this.collapsible) {
            if (e.defaultPrevented) return;
            if (!this.expanded) {
                if (this.expanded !== true) {
                    this.expanded = true;
                    this.expandedChange.emit(this.expanded);
                }
                this.showClear = true;
                if (this.focus !== true) {
                    this.focus = true;
                    this.focusChange.emit();
                }
            }
        }
    }
}