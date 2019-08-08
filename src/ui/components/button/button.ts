import { UIBinding, Property, Element } from '../../factory/decorator';
import { StateChanges } from '../../compiler/common/interfaces';
import { uniqueId } from '../../../utils';
import { replaceCSSString, IHTMLWidgetStyleSheet } from '../../../utils/domutils';
import { lightenColor, darkenColor } from '../../../utils/colorutils';

@UIBinding({
    selector: 'ne-button',
    template: `
        <div [ne-ui-id]="_id"
            [class]="{'ne-button': true, 'disabled': disabled}"
            [color]="_color"
            [mode]="mode"
            (click)="onClick($event)"
        >
            <style #styleEl type="text/css"></style>
            <div class="ne-button-inffix">
                <content/>
            </div><i/>
        </div>
    `,
    style: `
        .ne-button {
            display: inline-block;
            padding: 6px 12px;
            text-align: center;
            user-select: none;
            cursor: pointer;
            color: rgba(0, 0, 0, 0.8);
            border-radius: 4px;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            -webkit-transition: all 280ms cubic-bezier(.4,0,.2,1);
            transition: all 280ms cubic-bezier(.4,0,.2,1);
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
            overflow: hidden;
        }
        .ne-button .ne-button-inffix {
            display: inline-block;
            vertical-align: middle;
            font-size: inherit;
        }
        .ne-button > i {
            display: inline-block;
            vertical-align: middle;
            height: 100%;
            width: 0;
        }

        .ne-button:hover {
            background-color: rgba(125,125,125,0.06);
        }
        .ne-button:active {
            background-color: rgba(125,125,125,0.12);
        }
        .ne-button.disabled {
            opacity: 0.2;
            color: rgba(0, 0, 0, 0.8);
            cursor: default;
        }
        .ne-button[color="primary"] {
            color: rgba(26, 115, 232, 1);
        }

        .ne-button[mode="raised"] {
            -webkit-box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
            box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
        }
        .ne-button[mode="raised"]:hover {
            -webkit-box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
            box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
        }
        .ne-button[mode="raised"]:active {
            -webkit-box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12);
            box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12);
        }
        .ne-button[mode="raised"][color="primary"] {
            color: rgba(255, 255, 255, 0.8);
            background-color: rgba(26, 115, 232, 1);
        }
        .ne-button[mode="raised"][color="primary"]:hover {
            background-color: rgba(49, 129, 234, 1);
        }
        .ne-button[mode="raised"][color="primary"]:active {
            background-color: rgba(72 , 143, 236, 1);
        }

        .ne-button[mode="flat"][color="primary"] {
            color: rgba(255, 255, 255, 0.8);
            background-color: rgba(26, 115, 232, 1);
        }
        .ne-button[mode="flat"][color="primary"]:hover {
            background-color: rgba(49, 129, 234, 1);
        }
        .ne-button[mode="flat"][color="primary"]:active {
            background-color: rgba(72, 143, 236, 1);
        }

        .ne-button[mode="stroked"] {
            border: solid 2px rgba(125, 125, 125, 0.3);
        }

        .ne-button[mode="simulated"] {
            color: rgba(255, 255, 255, 0.8);
            background: -webkit-linear-gradient(rgba(49, 129, 234, 1), rgba(26, 115, 232, 1));
            background: linear-gradient(rgba(49, 129, 234, 1), rgba(26, 115, 232, 1));
            border: solid 1px rgba(26, 115, 232, 1);
            -webkit-box-shadow: inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.15);
            box-shadow: inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .ne-button[mode="simulated"]:hover {
            background: -webkit-linear-gradient(rgba(72 , 143, 236, 1), rgba(26, 115, 232, 1));
            background: linear-gradient(rgba(72 , 143, 236, 1), rgba(26, 115, 232, 1));
        }
        .ne-button[mode="simulated"]:active {
            color: rgba(26, 115, 232, 1) !important;
            border-color: rgba(26, 115, 232, 1);
            background: -webkit-linear-gradient(rgba(49, 129, 234, 1), rgba(26, 115, 232, 1));
            background: linear-gradient(rgba(49, 129, 234, 1), rgba(26, 115, 232, 1));
            -webkit-box-shadow: inset 0px 1px 3px rgba(0, 0, 0, 0.2), 0px 1px 0px rgba(0, 0, 0, 0);
            box-shadow: inset 0px 1px 3px rgba(0, 0, 0, 0.2), 0px 1px 0px rgba(0, 0, 0, 0);
            text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
        }
    `
})
export class Button {
    @Property() disabled = false;
    @Property() color: 'basic' | 'primary' = 'basic';
    @Property() mode: 'basic' | 'raised' | 'stroked' | 'flat' | 'simulated' = 'basic';

    @Element('styleEl') styleEl: HTMLElement;

    _color: string;
    _id: string = uniqueId('ne-button');

    onChanges(changes) {
        if (!changes || 'color' in changes) {
            this.styleEl.innerHTML = '';
            if (!this.color) {
                this._color = '';
            } else {
                this._color = this.color;
                if (this._color !== 'basic' && this._color !== 'primary') {
                    replaceCSSString(this.styleEl, this._createCSSString(this._color), `.ne-button[ne-ui-id=${this._id}]`)
                }
            }
        }
    }

    onClick(e: MouseEvent) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    private _createCSSString(baseColor: string): IHTMLWidgetStyleSheet[] {
        const hoverColor = lightenColor(baseColor);
        const activeColor = lightenColor(hoverColor);
        return [{
            "&": { color: baseColor, },
            "&:hover": { color: hoverColor, },
            "&:active": { color: activeColor, },
            "&[mode=raised]": { backgroundColor: baseColor, color: 'rgba(255, 255, 255, 0.8)', },
            "&[mode=raised]:hover": { backgroundColor: hoverColor, },
            "&[mode=raised]:active": { backgroundColor: activeColor, },
            "&[mode=flat]": { backgroundColor: baseColor, color: 'rgba(255, 255, 255, 0.8)', },
            "&[mode=flat]:hover": { backgroundColor: hoverColor, },
            "&[mode=flat]:active": { backgroundColor: activeColor, },
            "&[mode=simulated]": {
                color: 'rgba(255, 255, 255, 0.8)',
                background: `linear-gradient(${hoverColor}, ${baseColor})`,
                border: `solid 1px ${baseColor}`,
            },
            "&[mode=simulated]:hover": {
                background: `linear-gradient(${activeColor}, ${baseColor})`,
            },
            "&[mode=simulated]:active": {
                color: `${baseColor} !important`,
                borderColor: `${baseColor}`,
                background: `linear-gradient(${hoverColor}, ${baseColor})`,
            },
        }, {
            "&[mode=simulated]": {
                background: `-webkit-linear-gradient(${hoverColor}, ${baseColor})`,
            },
            "&[mode=simulated]:hover": {
                background: `-webkit-linear-gradient(${activeColor}, ${baseColor})`,
            },
            "&[mode=simulated]:active": {
                background: `-webkit-linear-gradient(${hoverColor}, ${baseColor})`,
            },
        }]
    }
}