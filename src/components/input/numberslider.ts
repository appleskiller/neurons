import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { addEventListener } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { theme } from '../style/theme';
import { IChangeDetector, StateChanges } from '../../binding/common/interfaces';
import { math, isDefined } from 'neurons-utils';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { NumberInput } from './number';
import { Slider } from '../slider/slider';
import { Button } from '../button/button';
import { SvgIcon } from '../icon/svgicon';
import { arrow_left, arrow_right } from '../icon/icons';
import { BINDING_TOKENS } from '../../binding/factory/injector';

@Binding({
    selector: 'ne-number',
    template: `
        <div class="ne-number"
            [class.focus]="focus"
            [class.invalid]="!!invalid"
            [readonly]="readonly ? '' : null"
            [disabled]="disabled ? '' : null"
        >
            <ne-button class="ne-number-left-btn"
                [disabled]="disabled"
                (mousedown)="onMouseDown($event, 'left')"
            ><ne-icon [icon]="arrow_left"></ne-icon></ne-button>
            <ne-number-input
                [min]="min"
                [max]="max"
                [step]="step"
                [placeholder]="placeholder"
                [readonly]="readonly"
                [required]="required"
                [disabled]="disabled"
                [integer]="integer"
                [focusSelectable]="focusSelectable"
                [alwaysTriggerChange]="alwaysTriggerChange"
                [mouseWheel]="mouseWheel"
                [name]="name"
                [(value)]="value"
                [(focus)]="focus"
                (invalidChange)="onInvalidChange($event)"
                (enterPressed)="onEnterPressed($event)"
                (change)="onChange($event)"
                (commit)="onCommit($event)"
            ></ne-number-input>
            <ne-button class="ne-number-right-btn"
                [disabled]="disabled"
                (mousedown)="onMouseDown($event, 'right')"
            ><ne-icon [icon]="arrow_right"></ne-icon></ne-button>
        </div>
    `,
    style: `
        .ne-number {
            position: relative;
            padding: 0 32px;
            box-sizing: border-box;
            border: solid 1px ${theme.gray.heavy};
            border-radius: 3px;
            height: 32px;
            transition: ${theme.transition.normal('border')};
            .ne-number-left-btn {
                position: absolute;
                top: 0;
                left: 0;
                padding: 4px 8px;
                height: 100%;
                border-radius: 0;
                border-right: solid 1px ${theme.gray.normal};
            }
            .ne-number-right-btn {
                position: absolute;
                top: 0;
                right: 0;
                padding: 4px 8px;
                height: 100%;
                border-radius: 0;
                border-left: solid 1px ${theme.gray.normal};
            }
            .ne-number-input {
                border: none;
                height: 100%;
                width: 100%;
                border-radius: 0;
                box-sizing: border-box;
                &:hover {
                    border: none;
                }
                &:focus {
                    border: none;
                }
                &:active {
                    border: none;
                }
            }
            &:hover {
                border: solid 1px rgba(125, 125, 125, 0.5);
            }
            &:not([readonly]).focus {
                border: solid 1px rgba(48, 125, 218, 0.8);
            }
            &.invalid {
                border-color: ${theme.color.error};
            }
        }
        .ne-number[readonly] {
            .ne-number-left-btn {
                cursor: default;
            }
            .ne-number-right-btn {
                cursor: default;
            }
        }

    `,
    requirements: [
        NumberInput,
        Slider,
        Button,
        SvgIcon
    ]
})
export class NumberSlider {
    @Property() min: number | string = '';
    @Property() max: number | string = '';
    @Property() step: number | string = '';
    @Property() value: number | string = '';
    @Property() name: string = '';
    @Property() placeholder: string = '';
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() disabled: boolean = false;
    @Property() integer: boolean = false;
    @Property() focus: boolean = false;
    @Property() focusSelectable: boolean = false;
    @Property() alwaysTriggerChange: boolean = false;
    @Property() mouseWheel: boolean = true;

    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() valueChange: IEmitter<number | string>;
    @Emitter() focusChange: IEmitter<boolean>;
    @Emitter() invalidChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<void>;
    @Emitter() commit: IEmitter<number | string>;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    invalid = false;

    arrow_left = arrow_left;
    arrow_right = arrow_right;

    onEnterPressed(e) {
        this.enterPressed.emit(e);
    }
    onInvalidChange(invalid) {
        this.invalid = invalid;
        this.invalidChange.emit(this.invalid);
    }
    onCommit(e) {
        this.commit.emit(e);
    }
    onChange() {
        this.change.emit();
    }
    onMouseDown(e: MouseEvent, btn: string) {
        this._stopLongPressing && this._stopLongPressing();
        e.preventDefault();
        if (this.readonly || this.disabled) return;
        if (!this.focus) {
            this.focus = true;
        }
        if (btn === 'left') {
            this._minus();
        } else {
            this._plus();
        }
        // 处理长按事件
        this._waitingForLongPress(e, () => {
            if (btn === 'left') {
                this._minus();
            } else {
                this._plus();
            }
            this.cdr.detectChanges();
        });
    }
    private _destroyed = false;
    onDestroy() {
        this._destroyed = true;
        this._stopLongPressing && this._stopLongPressing();
    }
    private _stopLongPressing = null;
    protected _waitingForLongPress(mousedownEvent: MouseEvent, onTick) {
        this._stopLongPressing && this._stopLongPressing();
        const events = [];
        let delay = 300;
        let timeId;
        const func = () => {
            if (this._destroyed) {
                this._stopLongPressing && this._stopLongPressing();
            } else {
                if (delay > 30) {
                    delay = delay * 3 / 4;
                }
                onTick && onTick();
            }
            timeId = setTimeout(func, delay);
        }
        timeId = setTimeout(func, delay);
        events.push(addEventListener(document, 'mouseup', () => { this._stopLongPressing && this._stopLongPressing() }));
        events.push(addEventListener(document, 'visibilitychange', () => { this._stopLongPressing && this._stopLongPressing() }));

        this._stopLongPressing = () => {
            clearTimeout(timeId);
            events.forEach(fn => fn());
            this._stopLongPressing = null;
        }
    }
    protected _plus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        let value = (typeof this.value === 'string' && this.value.trim() === '') ? 0 : math.plus(this._toNumber(this.value), step);
        // this._setValue(this._toNumber(value));
        this.value = this._toNumber(value);
    }
    protected _minus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        let value = (typeof this.value === 'string' && this.value.trim() === '') ? 0 : math.minus(this._toNumber(this.value), step);
        // this._setValue(this._toNumber(value));
        this.value = this._toNumber(value);
    }
    protected _toNumber(value) {
        return !this.integer ? this._toFloat(value) : this._toInt(value);
    }
    private _toFloat(value) {
        if (typeof value === 'string') {
            value = value.trim();
            value = value.replace(/[^-|.|0-9]/g, '');
            value = parseFloat(value);
        }
        if (!isNaN(value)) {
            const max = (!this.max && this.max !== 0) ? Number.POSITIVE_INFINITY : parseFloat(this.max as string);
            const min = (!this.min && this.min !== 0) ? Number.NEGATIVE_INFINITY : parseFloat(this.min as string);
            value = Math.max(min, Math.min(value, max));
        }
        return value;
    }
    private _toInt(value) {
        if (typeof value === 'string') {
            value = value.trim();
            value = value.replace(/[^-|.|0-9]/g, '');
            value = parseFloat(value);
        }
        if (!isNaN(value)) {
            const max = (!this.max && this.max !== 0) ? Number.POSITIVE_INFINITY : parseFloat(this.max as string);
            const min = (!this.min && this.min !== 0) ? Number.NEGATIVE_INFINITY : parseFloat(this.min as string);
            value = parseInt(Math.max(min, Math.min(value, max)) + '');
        }
        return value;
    }
}