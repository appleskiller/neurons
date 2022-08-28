import { IEmitter } from 'neurons-emitter';
import { color as colorUtils, isDefined, math } from 'neurons-utils';
import { Property, Binding, Emitter, Element, Inject } from '../../binding/factory/decorator';
import { SvgIcon } from '../icon/svgicon';
import { checkbox_uncheck, checkbox_check } from '../icon/icons';
import { theme } from '../style/theme';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { addEventListener } from 'neurons-dom';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IChangeDetector } from '../../binding/common/interfaces';
import { Slider } from './slider';
import { IToolTipRef } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk/popup/manager';

@Binding({
    selector: 'ne-h-slider',
    template: `
        <div class="ne-h-slider" tabindex="0" (focus)="onFocus()" (blur)="onBlur()">
            <div #bar class="ne-h-slider-bar" (mousewheel)="onMouseWheel($event)" (mousedown)="onMouseDown($event)" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
                <div class="ne-h-slider-bg"></div>
                <div class="ne-h-slider-progress-wrapper">
                    <div class="ne-h-slider-progress" [style.width]="position + 'px'"></div>
                </div>
                <div #valuePoint class="ne-h-slider-button-wrapper" [style.left]="position + 'px'">
                    <div #point class="ne-h-slider-button"></div>
                </div>
            </div>
        </div>
    `,
    style: `
        .ne-h-slider {
            position: relative;
            width: 100%;
            height: 32px;
            padding: 0 12px;
            box-sizing: border-box;
            user-select: none;
            .ne-h-slider-bar {
                position: relative;
                cursor: pointer;
                width: 100%;
                height: 100%;
                .ne-h-slider-bg {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    margin: auto;
                    height: 6px;
                    border-radius: 3px;
                    background-color: ${theme.gray.heavy};
                }
                .ne-h-slider-progress-wrapper {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    margin: auto;
                    height: 6px;
                    border-radius: 3px;
                    .ne-h-slider-progress {
                        position: relative;
                        width: 0;
                        height: 100%;
                        border-radius: 3px;
                        background-color: ${theme.color.primary};
                    }
                }
                .ne-h-slider-button-wrapper {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    transition: ${theme.transition.fast('transform')};
                    .ne-h-slider-button {
                        position: absolute;
                        top: -9px;
                        left: -9px;
                        width: 18px;
                        height: 18px;
                        border-radius: 12px;
                        background-color: ${theme.color.primary};
                        box-shadow: 0 0 0 3px ${theme.gray.heavy};
                    }
                }
                &:hover {
                    .ne-h-slider-button-wrapper {
                        transform: scale(1.2);
                    }
                }
            }
            &:focus {
                .ne-h-slider-button-wrapper {
                    transform: scale(1.2);
                }
            }
        }
        .ne-hslider-value-tooltip.ne-popup-panel {
            .ne-popup-panel-content {
                position: relative;
                overflow: initial;
                .ne-hslider-value-tooltip-caret {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 100%;
                    height: 8px;
                    overflow: hidden;
                    &:before {
                        content: ' ';
                        position: absolute;
                        top: -4px;
                        left: 0;
                        right: 0;
                        width: 8px;
                        height: 8px;
                        margin: auto;
                        transform: rotate(45deg);
                        background: ${theme.black.middle};
                    }
                }
            }
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class HSlider extends Slider {
    @Property() min: number = 0;
    @Property() max: number = 100;
    @Property() value: number = 50;
    @Property() step: number = 1;
    @Property() normalizeValue: boolean = true;

    @Property() valueFormatter: (value: number) => string;

    @Emitter() valueChange: IEmitter<number>;
    @Emitter() change: IEmitter<void>;

    @Element('bar') bar: HTMLElement;
    @Element('valuePoint') valuePoint: HTMLElement;
    @Element('point') point: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    position: number = 0;
    private _box = {x: 0, y: 0, width: 0, height: 0};
    private _mouseHandles = [];
    private _keyHandles = [];
    private _tipPointer: {x: number, y: number};
    private _tipRef: IToolTipRef;
    private _dragMoving: boolean = false;
    private _mouseHovering: boolean = false;

    onInit() {
        this._tipRef = popupManager.tooltip(`
            <div class="ne-hslider-value-tooltip-caret"></div>
            {{value}}
        `, {
            panelClass: 'ne-hslider-value-tooltip',
            delayTime: 0,
            position: 'top',
            state: {
                value: '',
            }
        });
    }

    onChanges(changes) {
        if (!changes) {
            this.measureSize();
        }
        if (!changes || 'min' in changes) {
            this.min = (!this.min && this.min !== 0) ? Number.NEGATIVE_INFINITY : parseFloat(this.min as any);
        }
        if (!changes || 'max' in changes) {
            this.max = (!this.max && this.max !== 0) ? Number.POSITIVE_INFINITY : parseFloat(this.max as any);
        }
        if (!changes || 'step' in changes) {
            this.step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as any);
        }
        if (!changes || 'min' in changes || 'max' in changes || 'value' in changes) {
            this.setValue(this.value);
            this.position = this.value2position(this.value, this._box.width);
            this.updateTipPosition(this.position);
            this._tipRef.updateOption({
                connectElement: this._tipPointer,
                state: {value: this._getValueLabel(this.value)},
            });
        }
    }
    onResize() {
        this.measureSize();
        this.position = this.value2position(this.value, this._box.width);
        this.updateTipPosition(this.position);
        this._tipRef.updateOption({
            connectElement: this._tipPointer,
            state: {value: this._getValueLabel(this.value)},
        });
    }
    onDestroy() {
        this._tipRef.close();
        this.unregisterMouseEvents();
        this.unregisterKeyEvents();
    }
    onFocus() {
        this.registerKeyEvents();
        this.position = this.value2position(this.value, this._box.width);
        this.updateTipPosition(this.position);
        this._tipRef.open(this._tipPointer);
    }
    onBlur() {
        this.unregisterKeyEvents();
        this._tipRef.close();
    }
    onMouseEnter() {
        if (this._dragMoving) return;
        this._mouseHovering = true;
        this.measureSize();
        this.position = this.value2position(this.value, this._box.width);
        this.updateTipPosition(this.position);
        this._tipRef.open(this._tipPointer);
    }
    onMouseLeave() {
        if (this._dragMoving) return;
        this._mouseHovering = false;
        this._tipRef.close();
    }
    onMouseDown(event: MouseEvent) {
        if (event.defaultPrevented) return;
        this._dragMoving = true;
        this.registerMouseEvents();
        this.measureSize();
        if (event.target !== this.point) {
            this.updateValue(this.position2value(event.clientX - this._box.x, this._box.width))
        }
    }
    onMouseWheel(event: WheelEvent) {
        if (event.defaultPrevented) return;
        if (event.ctrlKey) {
            if (event.deltaY > 0) {
                this.updateValue(math.plus(this.value, this.step * 10));
            } else {
                this.updateValue(math.minus(this.value, this.step * 10));
            }
        } else {
            if (event.deltaY > 0) {
                this.updateValue(math.plus(this.value, this.step));
            } else {
                this.updateValue(math.minus(this.value, this.step));
            }
        }
        event.preventDefault();
    }
    protected registerMouseEvents() {
        this.unregisterMouseEvents();
        this._mouseHandles.push(addEventListener(document, 'mousemove', (e: MouseEvent) => {
            // this.measureSize();
            this.updateValue(this.position2value(e.clientX - this._box.x, this._box.width));
            this.cdr.detectChanges();
        }));
        this._mouseHandles.push(addEventListener(document, 'mouseup', (e: MouseEvent) => {
            this._dragMoving = false;
            // this.measureSize();
            this.unregisterMouseEvents();
            // this.updateValue(this.position2value(e.clientX - this._box.x, this._box.width));
            // this.cdr.detectChanges();
            if (e.clientX < this._box.x || e.clientX > this._box.x + this._box.width || e.clientY < this._box.y || e.clientY > this._box.y + this._box.height) {
                this._tipRef.close();
            }
        }));
    }
    protected unregisterMouseEvents() {
        this._mouseHandles.forEach(fn => fn());
        this._mouseHandles = [];
    }
    protected registerKeyEvents() {
        this.unregisterKeyEvents();
        this._keyHandles.push(addEventListener(document, 'keydown', (e: KeyboardEvent) => {
            if (e.keyCode === 37) {
                // left
                this.updateValue(math.minus(this.value, this.step));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 39) {
                // right
                this.updateValue(math.plus(this.value, this.step));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 38) {
                // top
                this.updateValue(math.plus(this.value, this.step * 10));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 40) {
                // bottom
                this.updateValue(math.minus(this.value, this.step * 10));
                this.cdr.detectChanges();
                e.preventDefault();
            }
        }));
    }
    protected updateValue(value) {
        const old = this.value;
        this.setValue(value);
        this.position = this.value2position(this.value, this._box.width);
        this.updateTipPosition(this.position);
        this._tipRef.updateOption({
            connectElement: this._tipPointer,
            state: {value: this._getValueLabel(this.value)},
        });
        if (this.value !== old) {
            this.valueChange.emit(this.value);
            this.change.emit();
        }
    }
    protected unregisterKeyEvents() {
        this._keyHandles.forEach(fn => fn());
        this._keyHandles = [];
    }

    protected measureSize() {
        let box = this.bar.getBoundingClientRect();
        this._box.width = box.width;
        this._box.height = box.height;
        this._box.x = box.left;
        this._box.y = box.top;
    }
    protected updateTipPosition(valuePosition: number) {
        if (!this._tipPointer) { this._tipPointer = {x: 0, y: 0} };
        const box = this.valuePoint.getBoundingClientRect();
        this._tipPointer.y = box.top;
        this._tipPointer.x = this._box.x + valuePosition;
    }
    protected _getValueLabel(value: number) {
        if (this.valueFormatter) return this.valueFormatter(value);
        if (isNaN(value)) return '';
        if (!isDefined(value)) return '';
        return value;
    }
}