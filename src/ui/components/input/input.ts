import { UIBinding, Element, Property, Emitter } from '../../factory/decorator';
import { IEmitter } from '../../../helper/emitter';
import { StateChanges } from '../../compiler/common/interfaces';
import { plus, minus } from '../../../utils/mathutils';
import { nativeApi } from '../../compiler/common/domapi';
import { addEventListener, getCursorSelection, getCursorRange, replaceCursorText, replaceCursorTextRange } from '../../../utils/domutils';
import { isDefined } from '../../../utils/typeutils';

@UIBinding({
    selector: 'ne-input',
    template: `<input #input
        [class]="{'ne-input': true, 'invalid': invalid}"
        [name]="name" [placeholder]="placeholder"
        (propertychange)="onInputChange($event)"
        (keydown)="onKeyDown($event)"
        (keyup)="onKeyUp($event)"
        (input)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
    >`,
    style: `
        .ne-input {
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
        .ne-input:hover {
            border: solid 1px rgba(125, 125, 125, 0.5);
        }
        .ne-input:focus {
            border: solid 1px rgba(48, 125, 218, 0.8);
        }
        .ne-input.invalid::-webkit-input-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-input.invalid::-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-input.invalid:-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-input.invalid:-ms-input-placeholder {
           color: #f44336;
           border-color: #f44336;
        }
    `
})
export class Input {
    @Property() value: string = '';
    @Property() name: string = '';
    @Property() placeholder: string = '';
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() disabled: boolean = false;
    @Property() focus: boolean = false;
    
    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() valueChange: IEmitter<string>;
    @Emitter() focusChange: IEmitter<boolean>;
    @Emitter() invalidChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<void>;
    
    @Element('input') input: HTMLInputElement;
    
    invalid: boolean = false;
    private _inputing = false;
    private _mousewheelEvent = null;
    private _focused = false;

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
    onInputChange(e: KeyboardEvent) {
        this._setValue(this.input.value);
    }
    onFocus() {
        this._focused = true;
        this._inputing = true;
        this._mousewheelEvent && this._mousewheelEvent();
        this._mousewheelEvent = addEventListener(this.input, 'mousewheel', (e: MouseWheelEvent) => {
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
    private _plus() {
        const rangeText = getCursorSelection(this.input);
        const range = getCursorRange(this.input);
        const numberRange = this._findNumberRange(this.input.value, range, rangeText);
        if (!numberRange || !numberRange.number) return;
        const value = plus(this._toNumber(numberRange.number), 1);
        replaceCursorTextRange(this.input, value + '', numberRange.range);
        this._setValue(this.input.value);
    }
    private _minus() {
        const rangeText = getCursorSelection(this.input);
        const range = getCursorRange(this.input);
        const numberRange = this._findNumberRange(this.input.value, range, rangeText);
        if (!numberRange || !numberRange.number) return;
        const value = minus(this._toNumber(numberRange.number), 1);
        replaceCursorTextRange(this.input, value + '', numberRange.range);
        this._setValue(this.input.value);
    }
    private _toNumber(value) {
        if (typeof value === 'string') {
            value = value.trim();
            value = value.replace(/[^-|.|0-9]/g, '');
            value = parseFloat(value);
        }
        return value;
    }
    private _setValue(value) {
        let oriValue = value;
        const invalid = !!this._validateValue(oriValue);
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
    private _findNumberRange(value, range, rangeText): {number: string, range: [number, number]} {
        if (!range || !value) return null;
        let ret = rangeText || '';
        let startIndex = range[0];
        let endIndex = range[1];
        let i, char, dotCount = 0;
        for (i = startIndex - 1; i >= 0; i--) {
            char = value.charAt(i);
            if (/[\d|\.]/.test(char)) {
                if (char === '.') dotCount += 1;
                if (dotCount > 1) return null;
                startIndex = i;
                ret = char + ret;
            } else {
                break;
            }
        }
        for (i = endIndex; i < value.length; i++) {
            char = value.charAt(i);
            if (/[\d|\.]/.test(char)) {
                if (char === '.') dotCount += 1;
                if (dotCount > 1) return null;
                endIndex = i + 1;
                ret = ret + char;
            } else {
                break;
            }
        }
        return {
            number: ret,
            range: [startIndex, endIndex]
        };
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
