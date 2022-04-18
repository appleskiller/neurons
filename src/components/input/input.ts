import { Binding, Element, Property, Emitter } from '../../binding/factory/decorator';
import { addEventListener, getCursorSelection, getCursorRange, replaceCursorTextRange } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { theme } from '../style/theme';
import { StateChanges } from '../../binding/common/interfaces';
import { math, isDefined } from 'neurons-utils';
import { ISVGIcon } from 'neurons-dom/dom/element';

@Binding({
    selector: 'ne-input',
    template: `<input #input
        [class]="{'ne-input': true, 'invalid': invalid}"
        [placeholder]="placeholder"
        [maxlength]="maxLength"
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
            border-radius: 3px;
            padding: 4px 6px;
            font-size: inherit;
            transition: border-color 280ms cubic-bezier(.4,0,.2,1);
            box-sizing: border-box;
            transition: ${theme.transition.normal('border', 'color', 'background-color', 'opacity')};
        }
        .ne-input[readonly] {
            cursor: default;
        }
        .ne-input[disabled] {
            opacity: 0.3;
        }
        .ne-input:not([disabled]):hover {
            border: solid 1px rgba(125, 125, 125, 0.5);
        }
        .ne-input:not([readonly]):focus {
            border: solid 1px rgba(48, 125, 218, 0.8);
        }
        .ne-input.invalid {
            border-color: ${theme.color.error};
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
    @Property() type: string = 'text';
    @Property() value: number | string = '';
    @Property() name: string = '';
    @Property() placeholder: string = '';
    @Property() readonly: boolean = false;
    @Property() required: boolean = false;
    @Property() disabled: boolean = false;
    @Property() invalid: boolean = false;
    @Property() focus: boolean = false;
    @Property() selected: boolean = false;
    @Property() autocomplete: boolean = false;
    @Property() alwaysTriggerChange: boolean = false;
    @Property() mouseWheel: boolean = false;
    @Property() maxLength: number = undefined;
    
    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() escPressed: IEmitter<KeyboardEvent>;
    @Emitter() valueChange: IEmitter<number | string>;
    @Emitter() focusChange: IEmitter<boolean>;
    @Emitter() invalidChange: IEmitter<boolean>;
    @Emitter() change: IEmitter<void>;
    @Emitter() commit: IEmitter<number | string>;
    
    @Element('input') input: HTMLInputElement;
    
    private _inputing = false;
    private _mousewheelEvent = null;
    private _focused = false;
    private _destroyed = false;
    private _inputChanged = false;

    onDestroy() {
        this._destroyed = true;
        this._mousewheelEvent && this._mousewheelEvent();
    }
    onChanges(changes?: StateChanges) {
        if (!changes || 'type' in changes || 'autocomplete' in changes) {
            this.input.setAttribute('type', this.type);
            if (typeof this.autocomplete === 'boolean') {
                if (this.autocomplete) {
                    this.input.setAttribute('autocomplete', 'on')
                } else {
                    if (this.type === 'password') {
                        this.input.setAttribute('autocomplete', 'new-password')
                    } else {
                        this.input.setAttribute('autocomplete', 'off')
                    }
                }
            } else {
                this.input.setAttribute('autocomplete', this.autocomplete || '');
            }
        }
        if (!changes || 'name' in changes) {
            this.name ? this.input.setAttribute('name', this.name) : this.input.removeAttribute('name');
        }
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
            this.invalid = !!this._validateValue(this.value);
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
            this._inputChanged = false;
        }
        if (!changes || 'selected' in changes) {
            this._laterUpdateSelected();
        }
    }
    onInputChange(e: KeyboardEvent) {
        this._setValue(this.input.value);
    }
    onFocus() {
        this._focused = true;
        this._inputing = true;
        this._mousewheelEvent && this._mousewheelEvent();
        this._mousewheelEvent = addEventListener(this.input, 'wheel', (e) => {
            if (this.mouseWheel && !this.readonly && !this.disabled) {
                if (e.deltaY > 0) {
                    this._minus();
                } else if (e.deltaY < 0) {
                    // 滑轮向上
                    this._plus();
                }
                e.preventDefault();
            }
        });
        this.focusChange.emit(true);
    }
    onBlur() {
        this._focused = false;
        this._inputing = false;
        this._mousewheelEvent && this._mousewheelEvent();
        this._inputChanged && this._setValue(this.input.value);
        this.focusChange.emit(false);
        if (this._inputChanged) {
            this._inputChanged = false;
            this.commit.emit(this.value);
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
        if (!this.invalid && !this.disabled) {
            if (e.keyCode == 13) {
                this.enterPressed.emit(e);
                if (this._inputChanged) {
                    this._inputChanged = false;
                    this.commit.emit(this.value);
                }
            } else if (e.keyCode === 27) {
                this.escPressed.emit(e);
            }
        }
    }
    protected _plus() {
        const rangeText = getCursorSelection(this.input);
        const range = getCursorRange(this.input);
        const numberRange = this._findNumberRange(this.input.value, range, rangeText);
        if (!numberRange || !numberRange.number) return;
        const value = math.plus(this._toNumber(numberRange.number), 1);
        replaceCursorTextRange(this.input, value + '', numberRange.range);
        this._setValue(this.input.value);
    }
    protected _minus() {
        const rangeText = getCursorSelection(this.input);
        const range = getCursorRange(this.input);
        const numberRange = this._findNumberRange(this.input.value, range, rangeText);
        if (!numberRange || !numberRange.number) return;
        const value = math.minus(this._toNumber(numberRange.number), 1);
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
    protected _setValue(value) {
        const oriValue = value;
        const invalid = !!this._validateValue(value);
        // 如果正在输入则保持
        if (this._inputing) {
            this.input.value = (!isDefined(oriValue) || (typeof oriValue === 'number' && isNaN(oriValue))) ? '' : oriValue;
            this._changeInvalid(invalid);
            if (!this.invalid) {
                this._changeValue(value);
            } else if (this.alwaysTriggerChange){
                this._changeValue(value);
            }
        } else {
            this.input.value = (!isDefined(value) || (typeof value === 'number' && isNaN(value))) ? '' : value;
            this._changeInvalid(invalid);
            this._changeValue(value);
        }
    }
    private _changeValue(value) {
        if (this.value !== value) {
            this.value = value;
            this._inputChanged = true;
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
            if (!isDefined(value) || value === '' || (typeof value === 'number' && isNaN(value))) {
                return { required: true }
            }
        }
        return null;
    }
    private _laterUpdateSelected() {
        setTimeout(() => {
            if (this._destroyed) return;
            if (this.selected) {
                this.input.select();
            }
        }, 0);
    }
}
