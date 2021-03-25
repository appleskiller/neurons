import { getCursorRange, replaceCursorTextRange, setCursorSelection } from 'neurons-dom';
import { math, isDefined } from 'neurons-utils';
import { Binding, Property } from '../../binding/factory/decorator';
import { Input } from "./input";
import { NumberInput } from './number';

@Binding({
    selector: 'ne-digit-number-input',
    template: `<input #input
        [class]="{'ne-digit-number-input': true, 'ne-number-input': true, 'invalid': invalid}"
        [name]="name" [placeholder]="placeholder"
        (keydown)="onKeyDown($event)"
        (keyup)="onKeyUp($event)"
        (propertychange)="onInputChange($event)"
        (input)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
    >`,
    style: `
    `
})
export class DigitNumberInput extends NumberInput {
    // 整数位数
    @Property() digit: number;
    // 小数位数
    @Property() decimal: number;

    onChanges(changes) {
        super.onChanges(changes);
        if (!changes || 'digit' in changes || 'decimal' in changes) {
            this._setValue(this.value);
        }
    }
    protected _plus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        const value = this.input.value.trim() === '' ? 0 : math.plus(this._toNumber(this.input.value), step);
        this._setValue(this._toFixNumber(this._toNumber(value + '') + ''));
    }
    protected _minus() {
        const step = (!this.step && this.step !== 0) ? 1 : parseFloat(this.step as string);
        const value = this.input.value.trim() === '' ? 0 : math.minus(this._toNumber(this.input.value), step);
        this._setValue(this._toFixNumber(this._toNumber(value + '') + ''));
    }
    protected setInputValue(value) {
        const str = (!isDefined(value) || (typeof value === 'number' && isNaN(value))) ? '' : value;
        this.input.value = this._toFixNumber(str + '');
    }
    private _toFixNumber(value) {
        return (!isDefined(this.decimal) || this.decimal > 0) ? this._toFixFloat(value) : this._toFixInt(value);
    }
    private _toFixFloat(value) {
        if (!value) return null;
        const digit = (isDefined(this.digit) && this.digit >= 0) ? this.digit : -1;
        const decimal = (isDefined(this.decimal) && this.decimal >= 0) ? this.decimal : -1;
        if (digit > 0 || decimal > 0) {
            let sep = '';
            if (value.charAt(0) === '-') {
                sep = '-';
                value = value.substr(1);
            }
            const arr = value.split('.');
            if (arr.length > 1) {
                arr.length = 2;
            }
            digit > 0 && (arr[0] = this._fixZero(arr[0], digit));
            decimal > 0 && (arr[1] = this._fixZero(arr[1], this.decimal, true));
            value = sep + arr.join('.');
        };
        return value;
    }
    private _toFixInt(value) {
        if (!value) return null;
        const digit = (isDefined(this.digit) && this.digit >= 0) ? this.digit : -1;
        if (digit > 0) {
            let sep = '';
            if (value.charAt(0) === '-') {
                sep = '-';
                value = value.substr(1);
            }
            value = sep + this._fixZero(value, this.digit);
        }
        return value;
    }
    private _fixZero(str: string, digit: number, insertAfter = false) {
        const max = Math.pow(10, digit) - 1;
        if (isDefined(str) && str !== '') {
            str = Math.min(max, parseInt(str)) + '';
        }
        str = isDefined(str) ? str + '' : '';
        const len = str.length;
        if (len < digit) {
            for (let i = 0; i < digit - len; i++) { str = insertAfter ? str + '0' : '0' + str; };
        } else if (len > digit) {
            str = str.substr(0, digit);
        }
        return str;
    }
}
