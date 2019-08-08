import { requestFrame } from './asyncutils';

export type StopAnimationFunction = () => void;
export type TweeningFunction = (percent: number) => void;

export enum EasingType {
    'quinticOut' = 'quinticOut',
}

const easing = {
    quinticOut: function (k) {
        return --k * k * k * k * k + 1;
    },
}


export function tween(duration: number, tweening: TweeningFunction, done?: Function, type?: EasingType): StopAnimationFunction {
    type = type || EasingType.quinticOut;
    const easingFunction = easing[type];
    if (!easingFunction) return () => {};
    if (duration < 0) {
        done();
        return () => {};
    } else {
        let clearFunc, total = 0;
        const loop = (elapsedTime: number) => {
            total += elapsedTime;
            if (total >= duration) {
                done();
            } else {
                // 先调度request，保证时间标记能够覆盖tweening函数的执行时间，同时保证能够在tweening函数中执行stop
                clearFunc = requestFrame(loop);
                tweening(easingFunction(total / duration));
            }
        }
        clearFunc = requestFrame(loop);
        return () => { clearFunc(); };
    }
}


