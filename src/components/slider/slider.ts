import { math, isDefined } from 'neurons-utils';

export class Slider {
    min: number = 0;
    max: number = 100;
    value: number = 0;
    step: number = 1;
    normalizeValue: boolean = true;
    
    protected setValue(value: number) {
        if (typeof value === 'string') { value = parseFloat(value); }
        this.value = Math.min(this.max, Math.max(this.min, value));
    }
    protected plus() {
        const step = (!this.step && this.step !== 0) ? 1 : this.step;
        this.setValue(math.plus(this.value, step));
    }
    protected minus() {
        const step = (!this.step && this.step !== 0) ? 1 : this.step;
        this.setValue(math.minus(this.value, step));
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
        return distance * (value - this.min) / (this.max - this.min)
    }
}