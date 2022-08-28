import { IEmitter } from 'neurons-emitter';
import { color as colorUtils, isDefined } from 'neurons-utils';
import { Property, Binding, Emitter, Element, Inject } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check } from '../icon/icons';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { addEventListener } from 'neurons-dom';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IChangeDetector } from '../../binding/common/interfaces';

// lightness: 0 ~ 2
function drawColorWheel(saturation, lightness, radius: number, ctx: CanvasRenderingContext2D, thickness: number = 24) {
    const x = radius, y = radius;
    ctx.save();
    colorUtils.colorWheel360Hues.forEach((hue, i) => {
        const endAngle = (360 - i + 1) * Math.PI / 180;
        const startAngle = (360 - i - 1) * Math.PI / 180;
        // const innerSaturation = Math.round(100 * 0);
        // const innerLightness = Math.round(100 * lightness);
        // const outerSaturation = Math.round(100 * 1);
        // const outerLightness = Math.round(100 * lightness);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle, !1);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    })
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius - 24, 0, 360, false);
    ctx.fillStyle = '#999999';
    ctx.fill();
}

function drawLightnessRect(hue, saturation, lightness, width, height, ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.rect(0, 0, width, height);
    const saturationGradient = ctx.createLinearGradient(0, 0, width, 0);
    saturationGradient.addColorStop(0, `hsl(${hue}, 0%, 100%)`);
    saturationGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    ctx.fillStyle = saturationGradient;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.rect(0, 0, width, height);
    const lightnessGradient = ctx.createLinearGradient(0, 0, 0, height);
    lightnessGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    lightnessGradient.addColorStop(1, `rgba(0, 0, 0, 1)`);
    ctx.fillStyle = lightnessGradient;
    ctx.fill();
}

@Binding({
    selector: 'ne-color-wheel',
    template: `
        <div class="ne-color-wheel" #container>
            <div class="ne-color-wheel-bg" [style.width]="_box.width" [style.height]="_box.height" [style.padding]="_box.width * 0.15 + 'px' + ' ' + _box.height * 0.15 + 'px'">
                <div></div>
            </div>
            <canvas #wheelCanvas ></canvas>
            <canvas #lightnessCanvas ></canvas>
            <div class="ne-color-wheel-markers"
                [style.width]="_box.width"
                [style.height]="_box.height"
                (mousedown)="onWheelMouseDown($event)"
            >
                <div *for="data, i in wheelColors" [style.top]="data.y" [style.left]="data.x">
                    <div class="ne-color-wheel-marker-item" [class.primary]="i === 0" [style.background-color]="data.color"></div>
                </div>
            </div>
            <div class="ne-color-wheel-markers"
                [style.width]="_box.rw"
                [style.height]="_box.rh"
                (mousedown)="onLightnessMouseDown($event)"
            >
                <div [style.top]="hslData.y" [style.left]="hslData.x">
                    <div class="ne-color-wheel-marker-item"></div>
                </div>
            </div>
        </div>
    `,
    style: `
        .ne-color-wheel {
            position: relative;
            width: 100%;
            height: 100%;
            user-select: none;

            .ne-color-wheel-bg {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                margin: auto;
                z-index: 0;
                border-radius: 100%;
                background-color: #333333;
                padding: 52px;
                box-sizing: border-box;
                box-shadow: 0 0 0 1px #111111, 0 0 0 2px #666666;
                & > div {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 100%;
                    background-color: #222222;
                    box-shadow: 0 0 0 1px #111111, 0 0 0 2px #444444;
                }
            }
            & > canvas {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                margin: auto;
                transition: ${theme.transition.normal('opacity')};
            }
            .ne-color-wheel-markers {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                margin: auto;
                z-index: 1;
                & > * {
                    position: absolute;
                }
                .ne-color-wheel-marker-item {
                    position: absolute;
                    left: -8px;
                    top: -8px;
                    width: 16px;
                    height: 16px;
                    border: solid 1px #333333;
                    border-radius: 36px;
                    box-sizing: border-box;
                    box-shadow: inset 0 0 0px 1px #ffffff, inset 0 0 0 2px rgba(0, 0, 0, 0.24);
                    &.primary {
                        left: -12px;
                        top: -12px;
                        width: 24px;
                        height: 24px;
                        z-index: 999;
                        box-shadow: inset 0 0 0px 2px #ffffff, inset 0 0 0 4px rgba(0, 0, 0, 0.24);
                    }
                }
            }
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class ColorWheel {
    @Property() saturation: number = 100;
    @Property() lightness: number = 50;
    @Property() colors: string[] = [];

    @Emitter() colorsChange: IEmitter<string[]>;
    @Emitter() saturationChange: IEmitter<number>;
    @Emitter() lightnessChange: IEmitter<number>;
    @Emitter() change: IEmitter<{h: number, s: number, l: number}[]>;

    @Element('container') container: HTMLCanvasElement;
    @Element('wheelCanvas') wheelCanvas: HTMLCanvasElement;
    @Element('lightnessCanvas') lightnessCanvas: HTMLCanvasElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;
    
    protected wheelColors = [];
    protected hslData = {x: 0, y: 0};

    private _box = {x: 0, y: 0, width: 100, height: 100, rx: 0, ry: 0, rw: 100, rh: 100};
    private _radius: number = 50;
    private _wheelHandles = [];
    private _wheelThickness = 24;
    private _lightnessHandles = [];
    private _hueSteps: number[] = [];

    onChanges(changes) {
        if (!changes) {
            this.measureSize();
        }
        if (!changes || 'colors' in changes) {
            this.updateHueSteps();
            const pos = this.getFirstColorPosition();
            this.updateWheelColors(pos.x, pos.y);
            this.redrawColorWheel();
        }
        if (!changes || 'lightness' in changes || 'saturation' in changes) {
            const pos = this._hsl2pos(this.saturation, this.lightness);
            this.hslData.x = pos.x;
            this.hslData.y = pos.y;
            this.colors = this.wheelColors.map(v => colorUtils.linearGradientFromColorWheel(v.hue, this.saturation, this.lightness, 1));
            this.redrawLightnessRect();
        }
    }
    onResize() {
        this.measureSize();
        let pos = this.getFirstColorPosition();
        this.updateWheelColors(pos.x, pos.y);
        this.redrawColorWheel();
        pos = this._hsl2pos(this.saturation, this.lightness);
        this.hslData.x = pos.x;
        this.hslData.y = pos.y;
        this.redrawLightnessRect();
    }
    onDestroy() {
        this.unregisterWheelEvents();
        this.unregisterHslEvents();
    }
    onWheelMouseDown(event: MouseEvent) {
        if (event.defaultPrevented) return;
        this.unregisterWheelEvents();
        this.unregisterHslEvents();
        this.measureSize();
        if (this.mouseHoverWheel(event)) {
            this.updateWheelColors(event.clientX - this._box.x, event.clientY - this._box.y);
            this.redrawLightnessRect();
            this.registerWheelEvents();
            this.commitColors();
        }
    }
    onLightnessMouseDown(event: MouseEvent) {
        if (event.defaultPrevented) return;
        this.unregisterWheelEvents();
        this.unregisterHslEvents();
        this.measureSize();
        if (this.mouseHoverLight(event)) {
            this._updateHsl(event.clientX - this._box.rx, event.clientY - this._box.ry);
            this.registerHslEvents();
            this.commitHsl();
        }
    }
    protected registerWheelEvents() {
        this.unregisterWheelEvents();
        this.unregisterHslEvents();
        this._wheelHandles.push(addEventListener(document, 'mousemove', (e: MouseEvent) => {
            this.measureSize();
            this.updateWheelColors(e.clientX - this._box.x, e.clientY - this._box.y);
            this.redrawLightnessRect();
            this.commitColors();
            this.cdr.detectChanges();
        }));
        this._wheelHandles.push(addEventListener(document, 'mouseup', (e: MouseEvent) => {
            this.unregisterWheelEvents();
            this.unregisterHslEvents();
            this.measureSize();
            this.updateWheelColors(e.clientX - this._box.x, e.clientY - this._box.y);
            this.redrawLightnessRect();
            this.commitColors();
            this.cdr.detectChanges();
        }));
    }
    protected unregisterWheelEvents() {
        this._wheelHandles.forEach(fn => fn());
        this._wheelHandles = [];
    }
    protected registerHslEvents() {
        this.unregisterHslEvents();
        this._lightnessHandles.push(addEventListener(document, 'mousemove', (e: MouseEvent) => {
            this.measureSize();
            this._updateHsl(e.clientX - this._box.rx, e.clientY - this._box.ry);
            this.commitHsl();
            this.cdr.detectChanges();
        }));
        this._lightnessHandles.push(addEventListener(document, 'mouseup', (e: MouseEvent) => {
            this.measureSize();
            this.unregisterHslEvents();
            this._updateHsl(e.clientX - this._box.rx, e.clientY - this._box.ry);
            this.commitHsl();
            this.cdr.detectChanges();
        }));
    }
    protected unregisterHslEvents() {
        this._lightnessHandles.forEach(fn => fn());
        this._lightnessHandles = [];
    }
    protected mouseHoverWheel(event: MouseEvent) {
        const value = this._pos2polar(event.clientX - this._box.x, event.clientY - this._box.y, this._radius);
        return value.r >= this._radius - this._wheelThickness && value.r <= this._radius;
    }
    protected mouseHoverLight(event: MouseEvent) {
        const x = event.clientX - this._box.rx;
        const y = event.clientY - this._box.ry;
        return x >= 0 && x <= this._box.rw && y >= 0 && y <= this._box.rh;
    }
    protected measureSize() {
        let box = this.container.getBoundingClientRect();
        this._box.width = Math.min(box.width, box.height);
        this._box.height = this._box.width;
        this._radius = Math.floor(this._box.width / 2);
        this._box.x = box.left + (box.width - this._box.width) / 2;
        this._box.y = box.top + (box.height - this._box.height) / 2;
        this._box.rw = Math.floor(Math.sqrt(Math.pow((this._radius - this._wheelThickness - 16 / 2) * 2, 2) / 2));
        this._box.rh = this._box.rw;
        this._box.rx = box.left + (box.width - this._box.rw) / 2;
        this._box.ry = box.top + (box.height - this._box.rh) / 2;
    }
    protected redrawColorWheel() {
        this.wheelCanvas.width = this._radius * 2;
        this.wheelCanvas.height = this._radius * 2;
        const ctx = this.wheelCanvas.getContext('2d');
        drawColorWheel(100, 50, this._radius, ctx, this._wheelThickness);
    }
    protected redrawLightnessRect() {
        this.lightnessCanvas.width = this._box.rw;
        this.lightnessCanvas.height = this._box.rh;
        const data = this.wheelColors[0];
        const hue = data ? data.hue : 0;
        drawLightnessRect(colorUtils.wheelHueToHueFast(hue), 100, 50, this._box.rw, this._box.rh, this.lightnessCanvas.getContext('2d'));
    }
    protected updateHueSteps() {
        this._hueSteps = [];
        if (!this.colors || !this.colors.length) {
            this._hueSteps.push(0);
        } else {
            let firstHue;
            this.colors.forEach((color, index) => {
                const rgba = colorUtils.toRGBAArray(color);
                const hsl = colorUtils.rgbToHsl(rgba[0], rgba[1], rgba[2]);
                const hue = colorUtils.hueToWheelHueFast(hsl[0]);
                if (index === 0) {
                    firstHue = hue;
                    this._hueSteps.push(0);
                } else {
                    this._hueSteps.push(hue - firstHue);
                }
            });
        }
    }
    protected updateWheelColors(x, y) {
        this.wheelColors = [];
        const value = this._pos2polar(x, y, this._radius);
        this.wheelColors = this._hueSteps.map((step, index) => {
            const hue = this._normalizeHue(value.a + step);
            // 限定在圆环内
            const pos = this._polar2pos(hue, this._radius - this._wheelThickness / 2, this._radius);
            return {
                // 固定取色
                color: colorUtils.linearGradientFromColorWheel(hue, 100, 50, 1),
                hue: hue,
                x: pos.x,
                y: pos.y,
            }
        });
    }
    protected getFirstColorPosition() {
        if (!this.colors || !this.colors.length) {
            return {
                x: this._radius * 2,
                y: this._radius,
            }
        } else {
            const firstColor = this.colors[0];
            const rgb = colorUtils.toRGBAArray(firstColor);
            const hsl = colorUtils.rgbToHsl(rgb[0], rgb[1], rgb[2]);
            const hueInWheel = colorUtils.hueToWheelHueFast(hsl[0]);
            return this._polar2pos(hueInWheel, this._radius - this._wheelThickness / 2, this._radius);
        }
    }
    protected commitColors() {
        this.colors = this.wheelColors.map(v => colorUtils.linearGradientFromColorWheel(v.hue, this.saturation, this.lightness, 1));
        this.colorsChange.emit(this.colors);
        this.change.emit(this.wheelColors.map(v => {
            return {
                h: colorUtils.wheelHueToHueFast(v.hue),
                s: this.saturation,
                l: this.lightness,
            }
        }));
    }
    protected commitHsl() {
        this.saturationChange.emit(this.saturation);
        this.lightnessChange.emit(this.lightness);
        this.change.emit(this.wheelColors.map(v => {
            return {
                h: colorUtils.wheelHueToHueFast(v.hue),
                s: this.saturation,
                l: this.lightness,
            }
        }));
    }
    private _normalizeHue(hue: number): number {
        hue = hue % 360;
        return hue < 0 ? 360 + hue : hue;
    }
    private _updateHsl(x, y) {
        this.hslData.x = Math.max(0, Math.min(this._box.rw, x));
        this.hslData.y = Math.max(0, Math.min(this._box.rh, y));
        const hsl = this._pos2hsl(this.hslData.x, this.hslData.y);
        this.saturation = Math.round(hsl.s);
        this.lightness = Math.round(hsl.l);
    }
    private _pos2hsl(x, y) {
        const s = parseFloat(x / this._box.rw as any) * 100;
        const v = parseFloat((this._box.rh - y) / this._box.rh as any) * 100;
        const data = this.wheelColors[0];
        const hue = data ? data.hue : 0;
        // 将hsv转化为hsl
        const hsl = colorUtils.hsvToHsl(hue, s, v);
        return {
            h: hue,
            s: hsl[1],
            l: hsl[2],
        }
    }
    private _hsl2pos(saturation, lightness) {
        const data = this.wheelColors[0];
        const hue = data ? data.hue : 0;
        const hsv = colorUtils.hslToHsv(hue, saturation, lightness);
        return {
            x: this._box.rw * hsv[1] / 100,
            y: this._box.rh - this._box.rh * hsv[2] / 100
        }
    }
    private _pos2polar(x, y, r) {
        // 偏移到中心点
        x = x - r;
        y = y - r;
        const d = Math.sqrt(Math.pow(Math.abs(x), 2) + Math.pow(Math.abs(y), 2));
        const angle = d ? Math.acos(x / d) * 180 / Math.PI : 0;
        return {
            r: Math.round(d),
            a: Math.round(y > 0 ? 360 - angle : angle),
        }
    }
    private _polar2pos(a, d, r) {
        if (!d) return {x: r, y: r};
        const radian = (a <= 180 ? a : 360 - a) * Math.PI / 180;
        const x = Math.cos(radian) * d;
        const y = Math.sin(radian) * d;
        return {
            x: x + r,
            y: a <= 180 ? -y + r : y + r,
        }
    }
}