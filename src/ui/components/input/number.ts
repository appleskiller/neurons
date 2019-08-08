import { UIBinding, Element, Property, Emitter } from '../../factory/decorator';
import { IEmitter } from '../../../helper/emitter';
import { StateChanges } from '../../compiler/common/interfaces';
import { plus, minus } from '../../../utils/mathutils';
import { nativeApi } from '../../compiler/common/domapi';
import { addEventListener } from '../../../utils/domutils';
import { isDefined } from '../../../utils/typeutils';

// [step]="step" [min]="min" [max]="max"
@UIBinding({
    selector: 'ne-number-input',
    template: `<input #input
        [class]="{'ne-number-input': true, 'invalid': invalid}"
        [name]="name" [placeholder]="placeholder"
        (keydown)="onKeyDown($event)"
        (keyup)="onKeyUp($event)"
        (propertychange)="onInputChange($event)"
        (input)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
    >`,
    style: `
        .ne-number-input {
            display: inline;
            outline: none;
            background-color: transparent;
            color: inherit;
            border: solid 1px rgba(125, 125, 125, 0.3);
            border-radius: 2px;
            padding: 4px 6px;
            font-size: inherit;
            transition: border-color 280ms cubic-bezier(.4,0,.2,1);
        }
        .ne-number-input:hover {
            border: solid 1px rgba(125, 125, 125, 0.5);
        }
        .ne-number-input:focus {
            border: solid 1px rgba(48, 125, 218, 0.8);
        }
        .ne-number-input.invalid::-webkit-input-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-number-input.invalid::-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-number-input.invalid:-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-number-input.invalid:-ms-input-placeholder {
           color: #f44336;
           border-color: #f44336;
        }
    `
})
export class NumberInput {
    @Property() min: number | string = '';
    @Property() max: number | string = '';
    @Property() step: number | string = '';
    @Property() value: number | string = '';
    @Property() name: string = '';
    @Property() placeholder: string = '';
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() disabled: boolean = false;
    @Property() focus: boolean = false;

    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() valueChange: IEmitter<number | string>;
    @Emitter() focusChange: IEmitter<boolean>;
    @Emitter() invalidChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<void>;
    
    invalid: boolean = false;
    @Element('input') input: HTMLInputElement;

    private _inputing = false;
    private _focused = false;
    private _mousewheelEvent = null;

    onDestroy() {
        this._mousewheelEvent && this._mousewheelEvent();
    }
    onChanges(changes?: StateChanges) {
        if (!changes || 'readonly' in changes) {
            if (this.readonly) {
                this.input.setAttribute('readonly', '');
            } else {
                this.input.removeAttribute('readonly');
            }
        }
        if (!changes || 'required' in changes) {
            if (this.required) {
                this.input.setAttribute('required', '');
            } else {
                this.input.removeAttribute('required');
            }
        }
        if (!changes || 'disabled' in changes) {
            if (this.disabled) {
                this.input.setAttribute('disabled', '');
            } else {
                this.input.removeAttribute('disabled');
            }
        }
        if (!changes || 'focus' in changes) {
            const focused = this.focus;
            if (this._focused !== focused) {
                focused ? this.input.focus() : this.input.blur();
            }
        }
        if (!changes || 'value' in changes) {
            this._setValue(this.value);
        }
    }
    onKeyDown(e: KeyboardEvent) {
        if (e.keyCode == 38) {
            // up
            this._plus();
            e.preventDefault();
        } else if (e.keyCode == 40) {
            // down
            this._minus();
            e.preventDefault();
        }
    }
    onKeyUp(e: KeyboardEvent) {
        if (e.keyCode == 13) {
            if (!this.invalid && !this.disabled) {
                this.enterPressed.emit(e);
            }
        }
    }
    onInputChange(e: KeyboardEvent) {
        this.input.value = this.input.value.replace(/[^-|.|0-9]/g, '');
        this._setValue(this.input.value);
    }
    onFocus() {
        this._focused = true;
        this._inputing = true;
        this._mousewheelEvent && this._mousewheelEvent();
        this._mousewheelEvent = addEventListener(this.input, 'mousewheel', (e: WheelEvent) => {
            if (e.deltaY > 0) {
                // 滑轮向上
                this._plus();
            } else if (e.deltaY < 0) {
                this._minus();
            }
        });
        this.focusChange.emit(true);
    }
    onBlur() {
        this._focused = false;
        this._inputing = false;
        this._mousewheelEvent && this._mousewheelEvent();
        this._setValue(this.input.value);
        this.focusChange.emit(false);
    }
    private _plus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        const value = this.input.value.trim() === '' ? 0 : plus(this._toNumber(this.input.value), step);
        this._setValue(this._toNumber(value));
    }
    private _minus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        const value = this.input.value.trim() === '' ? 0 : minus(this._toNumber(this.input.value), step);
        this._setValue(this._toNumber(value));
    }
    private _toNumber(value) {
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
    private _setValue(value) {
        let oriValue = value;
        if (value !== '') {
            value = this._toNumber(value);
        }
        if (isNaN(value)) {
            value = '';
        }
        const invalid = (oriValue + '') !== (value + '') || !!this._validateValue(oriValue);
        // 如果正在输入则保持
        if (this._inputing) {
            this.input.value = oriValue;
            this._changeInvalid(invalid);
            if (!this.invalid) {
                this._changeValue(value);
            }
        } else {
            this.input.value = value;
            this._changeInvalid(invalid);
            this._changeValue(value);
        }
    }
    private _changeValue(value) {
        if (this.value !== value) {
            this.value = value;
            this.valueChange.emit(this.value);
            this.change.emit();
        }
    }
    private _changeInvalid(invalid) {
        if (this.invalid !== invalid) {
            this.invalid = invalid;
            this.invalidChange.emit(this.invalid);
        }
    }
    private _validateValue(value) {
        if (this.required) {
            if (!isDefined(value) || value === '' || isNaN(value)) {
                return { required: true }
            }
        }
        return null;
    }
}
