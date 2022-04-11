
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

@Binding({
    selector: 'ne-pallete-picker',
    template: `
        <div class="ne-pallete-picker">
            <ne-color-wheel
                [colors]="wheelColors"
                [(saturation)]="saturation"
                [(lightness)]="lightness"
                (change)="onColorWheelChange($event)"
            ></ne-color-wheel>
            <div class="ne-pallete-picker-colors">
                <div class="ne-pallete-picker-colors-container">
                    <div *for="color in colors" [style.width]="getColorWidth()">
                        <div [style.background-color]="color"></div>
                    </div>
                </div>
            </div>
            <div class="ne-pallete-picker-saturation ne-pallete-picker-slider">
                <div class="ne-pallete-picker-slider-label">饱和度</div>
                <ne-h-slider [min]="0" [max]="100" [(value)]="saturation" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-pallete-picker-slider-bg">
                    <div [style.background-image]="saturationColorGradient"></div>
                </div>
                <ne-number-input [(value)]="saturation" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
            </div>
            <div class="ne-pallete-picker-lightness ne-pallete-picker-slider">
                <div class="ne-pallete-picker-slider-label">明度</div>
                <ne-h-slider [min]="0" [max]="100" [(value)]="lightness" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-pallete-picker-slider-bg">
                    <div [style.background-image]="lightnessColorGradient"></div>
                </div>
                <ne-number-input [(value)]="lightness" [min]="0" [max]="100" (change)="onSliderChange()"></ne-number-input>
            </div>
            <div class="ne-pallete-picker-alpha ne-pallete-picker-slider">
                <div class="ne-pallete-picker-slider-label">透明度</div>
                <ne-h-slider [min]="0" [max]="1" [(value)]="alpha" [step]="0.01" (change)="onSliderChange()"></ne-h-slider>
                <div class="ne-pallete-picker-slider-bg">
                    <div [style.background-image]="alphaColorGradient"></div>
                </div>
                <ne-number-input [(value)]="alpha" [min]="0" [max]="1" [step]="0.01" (change)="onSliderChange()"></ne-number-input>
            </div>
        </div>
    `,
    style: `
        .ne-pallete-picker {
            position: relative;
            user-select: none;
            background-color: #333333;
            padding: 24px 12px;
            box-sizing: border-box;
            border-radius: 3px;
            .ne-color-wheel {
                width: 320px;
                height: 320px;
            }
            .ne-pallete-picker-colors {
                position: relative;
                border-radius: 3px;
                overflow: hidden;
                text-align: center;
                padding: 12px;
                box-sizing: border-box;
                .ne-pallete-picker-colors-container {
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
                        height: 100%;
                        & > div {
                            position: relative;
                            width: 100%;
                            height: 100%;
                        }
                    }
                }
            }
            .ne-pallete-picker-slider {
                position: relative;
                padding: 0 50px 0 56px;
                box-sizing: border-box;
                .ne-pallete-picker-slider-label {
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
                .ne-pallete-picker-slider-bg {
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
        NumberInput
    ]
})
export class PalletePicker {
    @Property() pallete: string[] = [];

    @Emitter() palleteChange: IEmitter<string[]>;
    @Emitter() change: IEmitter<void>;

    wheelColors: string[] = [];
    colors: string[] = [];
    hues: number[] = [];
    saturation: number = 100;
    lightness: number = 50;
    alpha: number = 1;
    saturationColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';
    lightnessColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';
    alphaColorGradient = 'linear-gradient(45deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))';

    onChanges(changes) {
        if (!changes || 'pallete' in changes) {
            this.wheelColors = this.pallete || [];
            this.colors = this.wheelColors.concat();
            this.updateProperties(this.wheelColors);
            this.updateSliders(this.hues, this.saturation, this.lightness, this.alpha);
        }
    }
    onColorWheelChange(datas: {h: number, s: number, l: number}[]) {
        this.hues = (datas || []).map(d => d.h);
        this.updateColors(this.hues, this.saturation, this.lightness, this.alpha);
        this.updateSliders(this.hues, this.saturation, this.lightness, this.alpha);
        this.commitPallete();
    }
    onSliderChange() {
        this.updateColors(this.hues, this.saturation, this.lightness, this.alpha);
        this.commitPallete();
    }
    getColorWidth() {
        return !!this.colors && !!this.colors.length ? Math.floor(10000 / this.colors.length) / 100 + '%' : '100%';
    }
    updateProperties(pallete: string[]) {
        if (!pallete || !pallete.length) {
            this.hues = [];
            this.saturation = 100;
            this.lightness = 50;
            this.alpha = 1;
        } else {
            let rgba, hsl;
            this.hues = pallete.map(c => {
                rgba = colorUtils.toRGBAArray(c);
                hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
                return hsl[0];
            })
            const typicalColor = pallete[0];
            rgba = colorUtils.toRGBAArray(typicalColor);
            hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
            this.lightness = Math.round(hsl[2]);
            this.saturation = Math.round(hsl[1]);
            this.alpha = Math.round(100 * rgba[3]) / 100;
        }
    }
    updateColors(hues: number[], s, l, a) {
        if (!hues || !hues.length) {
            this.colors = [];
        } else {
            // const typicalColor = pallete[0];
            // let rgba = colorUtils.toRGBAArray(typicalColor);
            // let hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
            // this.colors = pallete.map(color => {
            this.colors = hues.map(h => {
                // const rgba = colorUtils.toRGBAArray(color);
                // const hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
                // const rgb = colorUtils.hslToRgb(hsl[0], s, l);
                const rgb = colorUtils.hslToRgb(h, s, l);
                return colorUtils.rgbToCSSRGB(rgb[0], rgb[1], rgb[2], a * 255);
            });
        }
    }
    updateSliders(hues: number[], s, l, a) {
        const hue = hues && !!hues[0] ? hues[0] : 0;
        this.saturationColorGradient = `linear-gradient(45deg, hsl(0, 100%, 100%), hsl(${hue}, 100%, 50%))`;
        this.lightnessColorGradient = `linear-gradient(45deg, hsl(0, 0%, 0%), hsl(${hue}, 100%, 50%), hsl(${hue}, 100%, 100%))`;
        this.alphaColorGradient = `linear-gradient(45deg, hsla(0, 100%, 100%, 0), hsl(${hue}, 100%, 50%))`;
    }
    protected commitPallete() {
        this.pallete = this.colors.concat();
        this.palleteChange.emit(this.pallete);
        this.change.emit();
    }
}

