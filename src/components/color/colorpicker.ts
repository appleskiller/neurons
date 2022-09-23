
import { IEmitter } from 'neurons-emitter';
import { Property, Binding, Emitter, Element, Inject } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check, switch_icon } from '../icon/icons';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { ColorWheel } from './colorwheel';
import { color as colorUtils, isDefined } from 'neurons-utils';
import { HSlider } from '../slider/hslider';
import { IChangeDetector, IElementRef } from '../../binding/common/interfaces';
import { NumberInput } from '../input/number';
import { Input } from '../input/input';
import { Button } from '../button/button';
import { popupManager } from '../../cdk';
import { BINDING_TOKENS } from '../../binding';

@Binding({
    selector: 'ne-color-picker-panel',
    template: `
        <div class="ne-color-picker-panel" [class.mini-panel]="mini" [class.show-commit]="showCommitButton">
            <ne-color-wheel
                [colors]="wheelColors"
                [(saturation)]="saturation"
                [(lightness)]="lightness"
                (change)="onColorWheelChange($event)"
            ></ne-color-wheel>
            <div class="ne-color-picker-panel-colors">
                <div class="ne-color-picker-panel-colors-container">
                    <div [style.background-color]="originColor"></div>
                    <div [style.background-color]="color"></div>
                </div>
                <ne-input class="ne-color-picker-panel-hex" [focusSelectable]="true" [(value)]="hexColor" (change)="onHexChange()"></ne-input>
                <ne-button class="ne-color-picker-panel-switch" (click)="onSwitchChange()"><ne-icon [icon]="switch_icon"></ne-icon></ne-button>
            </div>
            <div *if="mode === 'HSLA'" class="ne-color-picker-panel-hue ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">色相</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="360" [(value)]="hue" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="hueColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="hue" [min]="0" [max]="360" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">H</div>
            </div>
            <div *if="mode === 'HSLA'" class="ne-color-picker-panel-saturation ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">饱和度</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="100" [(value)]="saturation" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="saturationColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="saturation" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">S</div>
            </div>
            <div *if="mode === 'HSLA'" class="ne-color-picker-panel-lightness ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">明度</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="100" [(value)]="lightness" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="lightnessColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="lightness" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">L</div>
            </div>
            <div *if="mode === 'RGBA'" class="ne-color-picker-panel-red ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">红色</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="255" [(value)]="red" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="redColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="red" [min]="0" [max]="255" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">R</div>
            </div>
            <div *if="mode === 'RGBA'" class="ne-color-picker-panel-green ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">绿色</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="255" [(value)]="green" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="greenColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="green" [min]="0" [max]="255" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">G</div>
            </div>
            <div *if="mode === 'RGBA'" class="ne-color-picker-panel-blue ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">蓝色</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="255" [(value)]="blue" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="blueColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="blue" [min]="0" [max]="255" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">B</div>
            </div>
            <div class="ne-color-picker-panel-alpha ne-color-picker-panel-slider">
                <div *if="!mini" class="ne-color-picker-panel-slider-label">透明度</div>
                <ne-h-slider *if="!mini" [min]="0" [max]="1" [(value)]="alpha" [step]="0.01" (change)="onSliderChange()"></ne-h-slider>
                <div *if="!mini" class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="alphaColorGradient"></div>
                </div>
                <ne-number-input [focusSelectable]="true" [(value)]="alpha" [min]="0" [max]="1" [step]="0.01" (change)="onSliderChange()"></ne-number-input>
                <div *if="!!mini" class="ne-color-picker-panel-slider-label">A</div>
            </div>
            <div *if="showCommitButton" class="ne-color-picker-panel-commit">
                <ne-button mode="flat" (click)="onCancel()">取消</ne-button>
                <ne-button mode="flat" color="primary" (click)="onCommit()">确定</ne-button>
            </div>
        </div>
    `,
    style: `
        .ne-color-picker-panel {
            position: relative;
            user-select: none;
            background-color: #333333;
            color: white;
            padding: 24px 12px;
            box-sizing: border-box;
            border-radius: 3px;
            width: 344px;
            .ne-color-wheel {
                height: 320px;
            }
            .ne-color-picker-panel-colors {
                position: relative;
                border-radius: 3px;
                overflow: hidden;
                text-align: center;
                padding: 12px 222px 12px 6px;
                box-sizing: border-box;
                .ne-color-picker-panel-colors-container {
                    position: relative;
                    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
                    width: 100%;
                    height: 28px;
                    border-radius: 3px;
                    overflow: hidden;
                    box-shadow: 0 0 0 1px #111111, 0 0 0 2px #666666;
                    & > * {
                        display: inline-block;
                        vertical-align: top;
                        box-sizing: border-box;
                        width: 50%;
                        height: 100%;
                    }
                }
                .ne-color-picker-panel-hex {
                    top: 10px;
                    right: 49px;
                    position: absolute;
                    width: 160px;
                    height: 32px;
                    text-align: center;
                    background-color: ${theme.gray.light};
                    box-shadow: inset 0 0 0 1px #222;
                }
                .ne-color-picker-panel-switch {
                    top: 11px;
                    right: 6px;
                    position: absolute;
                    color: inherit;
                    padding: 5px 8px;
                    border: solid 1px ${theme.gray.light};
                    font-size: 13px;
                    box-shadow: 0 0 0 1px #222;
                }
            }
            .ne-color-picker-panel-slider {
                position: relative;
                padding: 0 50px 0 56px;
                box-sizing: border-box;
                .ne-color-picker-panel-slider-label {
                    position: absolute;
                    top: 0;
                    left: 8px;
                    line-height: 30px;
                }
                .ne-h-slider {
                    z-index: 1;
                    .ne-h-slider-bg {
                        background-color: transparent;
                    }
                    .ne-h-slider-progress {
                        background-color: transparent;
                    }
                    .ne-h-slider-button {
                        top: -12px;
                        left: -4px;
                        width: 8px;
                        height: 24px;
                        border: solid 1px #333333;
                        border-radius: 3px;
                        box-sizing: border-box;
                        background-color: transparent;
                        box-shadow: inset 0 0 0px 2px #ffffff, inset 0 0 0 4px rgba(0, 0, 0, 0.24);
                    }
                }
                .ne-number-input {
                    position: absolute;
                    right: 6px;
                    top: 3px;
                    text-align: center;
                    width: 42px;
                    background-color: ${theme.gray.light};
                    box-shadow: inset 0 0 0 1px #222;
                }
                .ne-color-picker-panel-slider-bg {
                    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
                    position: absolute;
                    left: 68px;
                    right: 62px;
                    top: 6px;
                    bottom: 6px;
                    z-index: 0;
                    border-radius: 3px;
                    box-shadow: 0 0 0 1px #111111, 0 0 0 2px #666666;
                    overflow: hidden;
                    & > div {
                        position: relative;
                        width: 100%;
                        height: 100%;
                    }
                }
            }
            .ne-color-picker-panel-commit {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: solid 1px ${theme.gray.normal};
                .ne-button {
                    display: inline-block;
                    vertical-align: bottom;
                    width: 50%;
                    color: inherit;
                    border-radius: 0;
                }
            }
            &.mini-panel {
                .ne-color-picker-panel-slider {
                    position: relative;
                    top: initial;
                    left: initial;
                    display: inline-block;
                    vertical-align: top;
                    width: 25%;
                    text-align: center;
                    padding: 0px 6px;
                    box-sizing: border-box;
                    & > * {
                        position: relative;
                        top: initial;
                        left: initial;
                        right: initial;
                        width: 100%;
                    }
                }
            }
            &.show-commit {
                padding-bottom: 42px;
            }
        }
    `,
    requirements: [
        SvgIcon,
        ColorWheel,
        HSlider,
        NumberInput,
        Input,
        Button
    ]
})
export class ColorPickerPanel {
    @Property() color: string;
    @Property() showCommitButton: boolean = false;
    @Property() mini: boolean = false;

    @Emitter() colorChange: IEmitter<string>;
    @Emitter() change: IEmitter<void>;
    @Emitter() commit: IEmitter<string>;
    @Emitter() cancel: IEmitter<void>;

    mode = 'RGBA';
    modes = ['RGBA', 'HSLA'];
    switch_icon = switch_icon;
    originColor: string;
    hexColor: string = '';
    wheelColors: string[] = [];
    // colors: string = [];
    red: number = 0;
    blue: number = 0;
    green: number = 0;

    hue: number = 0;
    saturation: number = 100;
    lightness: number = 50;
    alpha: number = 1;
    redColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 1), rgba(255, 0, 0, 1))';
    greenColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 1), rgba(0, 255, 0, 1))';
    blueColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 1), rgba(0, 0, 255, 1))';
    hueColorGradient = 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)';
    saturationColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';
    lightnessColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';
    alphaColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';

    onChanges(changes) {
        if (!changes || 'color' in changes) {
            if (this.color && !this.originColor) {
                this.originColor = this.color;
            }
            this.wheelColors = this.color ? [this.color] : [];
            this.hexColor = this.color || '';
            this.updateProperties(this.color);
            this.updateSliders(this.hue);
        }
    }
    onColorWheelChange(datas: {h: number, s: number, l: number}[]) {
        if (datas && datas.length) {
            this.hue = datas[0].h;
            this.updateColors('HSLA');
            this.updateSliders(this.hue);
            this.commitPallete();
        }
    }
    onSliderChange() {
        this.updateColors(this.mode);
        this.wheelColors = [this.color];
        this.commitPallete();
    }
    onHexChange() {
        // 检查hex color有效性
        let rgba;
        try {
            rgba = colorUtils.toRGBAArray(this.hexColor);
        } catch (error) { }
        if (rgba && rgba.some(d => isNaN(d))) {
            rgba = null;
        }
        if (rgba) {
            this.color = this.hexColor;
            this.wheelColors = [this.color];
            this.updateProperties(this.color);
            this.updateSliders(this.hue);
            this.commitPallete();
        }
    }
    onSwitchChange() {
        let index = this.modes.indexOf(this.mode);
        index += 1;
        if (index >= this.modes.length) {
            index = 0;
        }
        this.mode = this.modes[index];
    }
    onCommit() {
        this.commit.emit(this.color);
    }
    onCancel() {
        this.cancel.emit();
    }
    updateProperties(color: string) {
        if (!color) {
            this.red = 0;
            this.blue = 0;
            this.green = 0;
            this.hue = 0;
            this.saturation = 100;
            this.lightness = 50;
            this.alpha = 1;
        } else {
            let rgba, hsl;
            const typicalColor = color;
            rgba = colorUtils.toRGBAArray(typicalColor);
            this.red = Math.round(rgba[0]);
            this.blue = Math.round(rgba[1]);
            this.green = Math.round(rgba[2]);
            hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
            this.hue = hsl[0];
            this.lightness = Math.round(hsl[2]);
            this.saturation = Math.round(hsl[1]);
            this.alpha = Math.round(100 * rgba[3] / 255) / 100;
        }
    }
    updateColors(mode) {
        let h, s, l, a, r, g, b;
        if (mode === 'HSLA') {
            h = this.hue;
            s = this.saturation;
            l = this.lightness;
            const rgb = colorUtils.hslToRgb(h, s, l);
            this.red = r = Math.round(rgb[0]);
            this.green = g = Math.round(rgb[1]);
            this.blue = b = Math.round(rgb[2]);
        } else {
            r = this.red;
            g = this.green;
            b = this.blue;
            const hsl = colorUtils.rgbToHsl(r, g, b);
            this.hue = h = Math.round(hsl[0]);
            this.saturation = s = Math.round(hsl[1]);
            this.lightness = l = Math.round(hsl[2]);
        }
        a = this.alpha || 1;
        this.color = "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + (Math.round(a * 100) / 100) + ")";
        if (a === 1) {
            this.hexColor = colorUtils.rgbToHexPound(r, g, b);
        } else {
            this.hexColor = this.color;
        }
    }
    updateSliders(h) {
        this.saturationColorGradient = `linear-gradient(45deg, hsl(0, 100%, 100%), hsl(${h}, 100%, 50%))`;
        this.lightnessColorGradient = `linear-gradient(45deg, hsl(0, 0%, 0%), hsl(${h}, 100%, 50%), hsl(${h}, 100%, 100%))`;
        this.alphaColorGradient = `linear-gradient(45deg, hsla(0, 100%, 100%, 0), hsl(${h}, 100%, 50%))`;
    }
    protected commitPallete() {
        this.colorChange.emit(this.color);
        this.change.emit();
    }
}


@Binding({
    selector: 'ne-color-picker',
    template: `
        <div class="ne-color-picker" [class.mini-panel]="mini" (click)="onClick($event)">
            <div [style.background-color]="color"></div>
        </div>
    `,
    style: `
        .ne-color-picker {
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 3px;
            overflow: hidden;
            cursor: pointer;
            & > div {
                width: 100%;
                height: 100%;
            }
        }
    `,
    requirements: [
        SvgIcon,
        Button
    ]
})
export class ColorPicker {
    @Property() color: string;
    @Property() mini: boolean = false;
    @Property() showCommitButton: boolean = false;

    @Property() popupMode: string = 'dropdown';
    @Property() position: string = 'leftTop';
    @Property() panelClass: string = '';
    @Property() connectElement: HTMLElement;

    @Emitter() colorChange: IEmitter<string>;
    @Emitter() change: IEmitter<void>;
    @Emitter() commit: IEmitter<string>;
    @Emitter() cancel: IEmitter<void>;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    onClick(e: MouseEvent) {
        let ref;
        const state = {
            mini: this.mini,
            showCommitButton: this.showCommitButton,
            color: this.color,
            onChange: () => {
                if (this.showCommitButton) return;
                if (this.color !== state.color) {
                    this.color = state.color;
                    this.colorChange.emit(this.color);
                    this.change.emit();
                    this.cdr.detectChanges();
                }
            },
            onCommit: (color) => {
                if (this.color !== color) {
                    this.color = color;
                    this.colorChange.emit(this.color);
                    this.change.emit();
                    this.cdr.detectChanges();
                }
                this.commit.emit(this.color);
                ref && ref.close();
            },
            onCancel: () => {
                this.cancel.emit();
                ref && ref.close();
            }
        };
        ref = popupManager.open(`
            <ne-color-picker-panel
                [mini]="mini"
                [showCommitButton]="showCommitButton"
                [(color)]="color"
                (change)="onChange()"
                (commit)="onCommit($event)"
                (cancel)="onCancel()"
            ></ne-color-picker-panel>
        `, {
            connectElement: this.connectElement || e.currentTarget as HTMLElement,
            popupMode: this.popupMode,
            position: this.position,
            panelClass: `ne-color-picker-popup ${this.panelClass}`,
            state: state
        })
    }
}