
import { IEmitter } from 'neurons-emitter';
import { Property, Binding, Emitter, Element } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check } from '../icon/icons';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { ColorWheel } from './colorwheel';
import { color as colorUtils, isDefined } from 'neurons-utils';
import { HSlider } from '../slider/hslider';
import { IElementRef } from '../../binding/common/interfaces';
import { NumberInput } from '../input/number';
import { Input } from '../input/input';

@Binding({
    selector: 'ne-color-picker-panel',
    template: `
        <div class="ne-color-picker-panel">
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
                <ne-input class="ne-color-picker-panel-hex" [(value)]="hexColor" (change)="onHexChange()"></ne-input>
            </div>
            <div class="ne-color-picker-panel-hue ne-color-picker-panel-slider">
                <div class="ne-color-picker-panel-slider-label">色相</div>
                <ne-h-slider [min]="0" [max]="360" [(value)]="hue" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="hueColorGradient"></div>
                </div>
                <ne-number-input [(value)]="hue" [min]="0" [max]="360" (change)="onSliderChange()"></ne-number-input>
            </div>
            <div class="ne-color-picker-panel-saturation ne-color-picker-panel-slider">
                <div class="ne-color-picker-panel-slider-label">饱和度</div>
                <ne-h-slider [min]="0" [max]="100" [(value)]="saturation" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="saturationColorGradient"></div>
                </div>
                <ne-number-input [(value)]="saturation" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
            </div>
            <div class="ne-color-picker-panel-lightness ne-color-picker-panel-slider">
                <div class="ne-color-picker-panel-slider-label">明度</div>
                <ne-h-slider [min]="0" [max]="100" [(value)]="lightness" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="lightnessColorGradient"></div>
                </div>
                <ne-number-input [(value)]="lightness" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
            </div>
            <div class="ne-color-picker-panel-alpha ne-color-picker-panel-slider">
                <div class="ne-color-picker-panel-slider-label">透明度</div>
                <ne-h-slider [min]="0" [max]="1" [(value)]="alpha" [step]="0.01" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-color-picker-panel-slider-bg">
                    <div [style.background-image]="alphaColorGradient"></div>
                </div>
                <ne-number-input [(value)]="alpha" [min]="0" [max]="1" [step]="0.01" (change)="onSliderChange()"></ne-number-input>
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
                padding: 12px 180px 12px 12px;
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
                    right: 12px;
                    position: absolute;
                    width: 160px;
                    height: 32px;
                    text-align: center;
                    background-color: ${theme.gray.light};
                    box-shadow: inset 0 0 0 1px #222;
                }
            }
            .ne-color-picker-panel-slider {
                position: relative;
                padding: 0 50px 0 56px;
                box-sizing: border-box;
                .ne-color-picker-panel-slider-label {
                    position: absolute;
                    top: 0;
                    left: 12px;
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
                    right: 12px;
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
        }
    `,
    requirements: [
        SvgIcon,
        ColorWheel,
        HSlider,
        NumberInput,
        Input
    ]
})
export class ColorPickerPanel {
    @Property() color: string;

    @Emitter() colorChange: IEmitter<string>;
    @Emitter() change: IEmitter<void>;

    originColor: string;
    hexColor: string = '';
    wheelColors: string[] = [];
    // colors: string = [];
    hue: number = 0;
    saturation: number = 100;
    lightness: number = 50;
    alpha: number = 1;
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
            this.updateProperties(this.color);
            this.updateSliders(this.hue, this.saturation, this.lightness, this.alpha);
        }
    }
    onColorWheelChange(datas: {h: number, s: number, l: number}[]) {
        if (datas && datas.length) {
            this.hue = datas[0].h;
            this.updateColors(this.hue, this.saturation, this.lightness, this.alpha);
            this.updateSliders(this.hue, this.saturation, this.lightness, this.alpha);
            this.commitPallete();
        }
    }
    onSliderChange() {
        this.updateColors(this.hue, this.saturation, this.lightness, this.alpha);
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
            this.updateSliders(this.hue, this.saturation, this.lightness, this.alpha);
            this.commitPallete();
        }
    }
    updateProperties(color: string) {
        if (!color) {
            this.hue = 0;
            this.saturation = 100;
            this.lightness = 50;
            this.alpha = 1;
        } else {
            let rgba, hsl;
            const typicalColor = color;
            rgba = colorUtils.toRGBAArray(typicalColor);
            hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
            this.hue = hsl[0];
            this.lightness = Math.round(hsl[2]);
            this.saturation = Math.round(hsl[1]);
            this.alpha = Math.round(100 * rgba[3] / 255) / 100;
        }
    }
    updateColors(h, s, l, a) {
        const rgb = colorUtils.hslToRgb(h, s, l);
        this.color = "rgba(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + "," + (Math.round(a * 100) / 100) + ")";
        if (!a || a === 1) {
            this.hexColor = colorUtils.rgbToHexPound(rgb[0], rgb[1], rgb[2]);
        } else {
            this.hexColor = this.color;
        }
    }
    updateSliders(h, s, l, a) {
        this.saturationColorGradient = `linear-gradient(45deg, hsl(0, 100%, 100%), hsl(${h}, 100%, 50%))`;
        this.lightnessColorGradient = `linear-gradient(45deg, hsl(0, 0%, 0%), hsl(${h}, 100%, 50%), hsl(${h}, 100%, 100%))`;
        this.alphaColorGradient = `linear-gradient(45deg, hsla(0, 100%, 100%, 0), hsl(${h}, 100%, 50%))`;
    }
    protected commitPallete() {
        this.colorChange.emit(this.color);
        this.change.emit();
    }
}

