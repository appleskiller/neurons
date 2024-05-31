import { math, isDefined, isArray } from 'neurons-utils';

export class Slider {
    min: number = 0;
    max: number = 100;
    values: number[] = [50];
    step: number = 1;
    normalizeValue: boolean = true;

    protected updateValue(value: number, valueIndex: number): boolean {
        this.values = this.values || [];
        const old = this.values[valueIndex];
        value = Math.min(this.max, Math.max(this.min, value));
        this.values[valueIndex] = value;
        return value !== old;
    }
    
    protected setValue(values: number[]) {
        this.values = values.map(value => {
            if (typeof value === 'string') { value = parseFloat(value); }
            return Math.min(this.max, Math.max(this.min, value));
        })
    }
    protected plus(valueIndex?: number) {
        const step = (!this.step && this.step !== 0) ? 1 : this.step;
        if (!isDefined(valueIndex)) {
            this.setValue(this.values.map(value => {
                return math.plus(value, step);
            }));
        } else {
            const value = this.values[valueIndex];
            this.values[valueIndex] = math.plus(value, step);
            this.setValue(this.values.concat());
        }
    }
    protected minus(valueIndex?: number) {
        const step = (!this.step && this.step !== 0) ? 1 : this.step;
        if (!isDefined(valueIndex)) {
            this.setValue(this.values.map(value => {
                return math.minus(value, step);
            }));
        } else {
            const value = this.values[valueIndex];
            this.values[valueIndex] = math.minus(value, step);
            this.setValue(this.values.concat());
        }
    }
    protected position2value(pos: number, distance: number): number {
        if (!pos || !distance) return 0;
        // let value = this.min + (this.max - this.min) * pos / distance;
        let value = math.plus(this.min, math.division(math.multiply(math.minus(this.max, this.min) , pos) , distance));
        if (this.normalizeValue && !!this.step) {
            // 按step计算最接近的值
            const quotient = Math.floor((value - this.min) / this.step);
            const remainder = (value - this.min) % this.step;
            if (remainder === 0) {
                value = math.plus(this.min, math.multiply(this.step, quotient));
            } else {
                if (remainder / this.step >= 0.5) {
                    value = math.plus(this.min, math.multiply(this.step, quotient + 1));
                } else {
                    value = math.plus(this.min, math.multiply(this.step, quotient));
                }
            }
        }
        return value;
    }
    protected value2position(value: number, distance: number): number {
        if (!value || !distance) return 0;
        const pos = distance * (value - this.min) / (this.max - this.min);
        return isNaN(pos) ? 0 : pos;
    }
    protected value2positions(values: number[], distance: number): number[] {
        if (!values) return [];
        return values.map(value => this.value2position(value, distance));
    }
}