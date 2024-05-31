import { IEmitter } from 'neurons-emitter';
import { color as colorUtils, isArray, isDefined, math } from 'neurons-utils';
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
            <div #bar class="ne-h-slider-bar" (mousewheel)="onMouseWheel($event)" (mousedown)="onMouseDown($event)" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave()">
                <div class="ne-h-slider-bg"></div>
                <div class="ne-h-slider-progress-wrapper">
                    <div class="ne-h-slider-progress" [style.left]="getProgressLeft()" [style.width]="getProgressWidth()"></div>
                </div>
                <div *for="position in positions" class="ne-h-slider-button-wrapper" [style.left]="position + 'px'">
                    <div class="ne-h-slider-button"></div>
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
        .ne-hslider-value-tooltip.ne-popup-panel[popup-position=bottom] {
            .ne-popup-panel-content {
                .ne-hslider-value-tooltip-caret {
                    position: absolute;
                    top: -4px;
                    height: 4px;
                    overflow: hidden;
                    &:before {
                        top: 1px;
                        transform: rotate(45deg);
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
    @Property() value: number | number[] = 50;
    @Property() step: number = 1;
    @Property() normalizeValue: boolean = true;
    @Property() tooltipClasses: string = '';
    @Property() tooltipEnabled: boolean = true;

    @Property() valueFormatter: (value: number) => string;

    @Emitter() valueChange: IEmitter<number | number[]>;
    @Emitter() change: IEmitter<void>;

    @Element('bar') bar: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    values: number[] = [50];

    positions: number[] = [];

    private _box = {x: 0, y: 0, width: 0, height: 0};
    private _mouseHandles = [];
    private _keyHandles = [];
    private _tipPointers: {x: number, y: number}[];
    private _tipRefs: IToolTipRef[];
    private _dragMoving: boolean = false;
    private _mouseHovering: boolean = false;
    private _singleSlider = true;
    private _rangeSlider = false;
    private _multiSlider = false;
    private _tipIndex = 0;

    onInit() {
    }

    onChanges(changes) {
        if (!changes) {
            this.measureSize();
        }
        if (!changes || 'tooltipClasses' in changes) {
            this._tipRefs && this._tipRefs.forEach(ref => ref.updateOption({
                panelClass: 'ne-hslider-value-tooltip ' + (this.tooltipClasses || '')
            }))
        }
        if (!changes || 'tooltipEnabled' in changes) {
            this._tipRefs && this._tipRefs.forEach(ref => {
                !this.tooltipEnabled && ref.close();
            })
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
            this.setValue(isArray(this.value) ? this.value as number[] : [this.value as number]);
            this._singleSlider = this.values.length <= 1;
            this._rangeSlider = this.values.length === 2;
            this._multiSlider = this.values.length > 2;
            
            this.positions = this.value2positions(this.values, this._box.width);
            this._tipIndex = Math.max(0, Math.min(this.positions.length - 1, this._tipIndex));
            this.updateTipPositions();
            this.updateTipStates();
        }
    }
    onResize() {
        this.measureSize();
        this.positions = this.value2positions(this.values, this._box.width);
        this.updateTipPositions();
        this.updateTipStates();
    }
    onDestroy() {
        this._tipRefs.forEach(ref => ref.close());
        this.unregisterMouseEvents();
        this.unregisterKeyEvents();
    }
    onFocus() {
        this.registerKeyEvents();
        // this.positions = this.value2positions(this.values, this._box.width);
        this.updateTipPositions();
        this.tooltipEnabled && this._tipRefs.forEach((ref, index) => ref.open(this._tipPointers[index]));
    }
    onBlur() {
        this.unregisterKeyEvents();
        this._tipRefs.forEach(ref => ref.close());
    }
    onMouseEnter(event: MouseEvent) {
        if (this._dragMoving) return;
        this._mouseHovering = true;
        this.measureSize();
        // this.positions = this.value2positions(this.values, this._box.width);
        if (this._singleSlider) {
            this._tipIndex = 0;
        } else {
            this._tipIndex = this._getNearestPositionIndex(event.clientX - this._box.x, this.positions);
        }
        this.updateTipPositions();
        this.tooltipEnabled && this._tipRefs.forEach((ref, index) => ref.open(this._tipPointers[index]));
    }
    onMouseLeave() {
        if (this._dragMoving) return;
        this._mouseHovering = false;
        this._tipRefs.forEach(ref => ref.close());
    }
    onMouseDown(event: MouseEvent) {
        if (event.defaultPrevented) return;
        // 屏蔽左键之外的按键
        if (!!event.button) return;
        this._dragMoving = true;
        this.registerMouseEvents();
        this.measureSize();
        // 查找最近的position的索引
        if (this._singleSlider) {
            this._tipIndex = 0;
        } else {
            this._tipIndex = this._getNearestPositionIndex(event.clientX - this._box.x, this.positions);
        }
        this.updateValueAndPosition(this._tipIndex, this.position2value(event.clientX - this._box.x, this._box.width));
    }
    onMouseWheel(event: WheelEvent) {
        if (event.defaultPrevented) return;
        if (this._tipIndex >= 0 && this._tipIndex < this.values.length) {
            const value = this.values[this._tipIndex];
            if (event.ctrlKey) {
                if (event.deltaY > 0) {
                    this.updateValueAndPosition(this._tipIndex, math.plus(value, this.step * 10));
                } else {
                    this.updateValueAndPosition(this._tipIndex, math.minus(value, this.step * 10));
                }
            } else {
                if (event.deltaY > 0) {
                    this.updateValueAndPosition(this._tipIndex, math.plus(value, this.step));
                } else {
                    this.updateValueAndPosition(this._tipIndex, math.minus(value, this.step));
                }
            }
        }
        event.preventDefault();
    }
    getProgressLeft() {
        if (this._multiSlider) return '0';
        if (this._singleSlider) return '0';
        const p1 = this.positions[0] || 0;
        const p2 = this.positions[1] || 0;
        const position = Math.max(0, Math.min(p1, p2));
        return position + 'px';
    }
    getProgressWidth() {
        if (this._multiSlider) return '0';
        const p1 = this.positions[0] || 0;
        if (this._singleSlider) return p1 + 'px';
        const p2 = this.positions[1] || 0;
        const width = Math.abs(p2 - p1);
        return width + 'px';
    }
    protected registerMouseEvents() {
        this.unregisterMouseEvents();
        this._mouseHandles.push(addEventListener(document, 'mousemove', (e: MouseEvent) => {
            // this.measureSize();
            this.updateValueAndPosition(this._tipIndex, this.position2value(e.clientX - this._box.x, this._box.width));
            this.cdr.detectChanges();
        }));
        this._mouseHandles.push(addEventListener(document, 'mouseup', (e: MouseEvent) => {
            this._dragMoving = false;
            // this.measureSize();
            this.unregisterMouseEvents();
            // this.updateValue(this.position2value(e.clientX - this._box.x, this._box.width));
            // this.cdr.detectChanges();
            if (e.clientX < this._box.x || e.clientX > this._box.x + this._box.width || e.clientY < this._box.y || e.clientY > this._box.y + this._box.height) {
                this._tipRefs.forEach(ref => ref.close());
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
            const value = this.values[this._tipIndex];
            if (e.keyCode === 37) {
                // left
                this.updateValueAndPosition(this._tipIndex, math.minus(value, this.step));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 39) {
                // right
                this.updateValueAndPosition(this._tipIndex, math.plus(value, this.step));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 38) {
                // top
                this.updateValueAndPosition(this._tipIndex, math.plus(value, this.step * 10));
                this.cdr.detectChanges();
                e.preventDefault();
            } else if (e.keyCode === 40) {
                // bottom
                this.updateValueAndPosition(this._tipIndex, math.minus(value, this.step * 10));
                this.cdr.detectChanges();
                e.preventDefault();
            }
        }));
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
    protected updateTipPositions() {
        const wrapperDom = this._findHandleWrapperDom();
        if (!wrapperDom) return;
        const box = wrapperDom.getBoundingClientRect();
        this.positions = this.positions || [];
        this._tipPointers = this._tipPointers || [];
        this._tipPointers.length = this.positions.length;
        this.positions.forEach((position, index) => {
            this._tipPointers[index] = {x: this._box.x + position, y: box.top};
        });
    }
    protected updateTipStates() {
        if (!this.values) return;
        this._tipRefs = this._tipRefs || [];
        this._tipPointers = this._tipPointers || [];
        for (let i = 0; i < this._tipPointers.length; i++) {
            const point = this._tipPointers[i];
            if (!this._tipRefs[i]) {
                this._tipRefs[i] = this._createTip()
            }
            this._tipRefs[i].updateOption({
                connectElement: point,
                state: {value: this._getValueLabel(this.values[i])},
            });
        }
        for (let j = this._tipPointers.length; j < this._tipRefs.length; j++) {
            this._tipRefs[j].close();
        }
        this._tipRefs.length = this._tipPointers.length;
    }
    protected _getValueLabel(value: number) {
        if (this.valueFormatter) return this.valueFormatter(value);
        if (isNaN(value)) return '';
        if (!isDefined(value)) return '';
        return value;
    }
    protected updateValueAndPosition(index: number, value: number) {
        const changed = this.updateValue(value, index);
        if (isArray(this.value)) {
            this.value = this.values;
        } else {
            this.value = this.values[0];
        }
        value = this.values[index];
        // update position
        this.positions = this.positions || [];
        this.positions[index] = this.value2position(value, this._box.width);
        this.updateTipPositions();
        this.updateTipStates();
        if (changed) {
            this.valueChange.emit(this.value);
            this.change.emit();
        }
    }

    private _findHandleWrapperDom() {
        return this.bar.querySelector('.ne-h-slider-button-wrapper');
    }
    private _findHandleButtonDom() {
        return this.bar.querySelector('.ne-h-slider-button-wrapper > .ne-h-slider-button');
    }
    private _getNearestPositionIndex(x: number, positions: number[]): number {
        if (!positions || !positions.length) return null;
        if (positions.length === 1) return 0;
        let nearest = 0, index = 0;
        positions.forEach((position, i) => {
            const distance = Math.abs(position - x);
            if (!nearest || distance < nearest) {
                nearest = distance;
                index = i;
            }
        });
        return index;
    }
    private _createTip() {
        return popupManager.tooltip(`
            <div class="ne-hslider-value-tooltip-caret"></div>
            {{value}}
        `, {
            panelClass: 'ne-hslider-value-tooltip ' + (this.tooltipClasses || ''),
            delayTime: 0,
            position: 'top',
            state: {
                value: '',
            }
        })
    }
}