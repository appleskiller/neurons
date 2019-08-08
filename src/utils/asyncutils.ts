import { globalCache } from './cacheutils';
import { isDefined } from './typeutils';
import { isBrowser } from './osutils';

export interface ObservableLike<T> {
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): any;
    pipe(...operations: any[]): ObservableLike<any>;
}

const tickerStatus = globalCache('internalTickerStatus', () => {
    const status = {
        callbacks: {},
        pending: false,
        idCounter: 1,
        invokeCallbacks: function() {
            status.pending = false;
            const copy = status.callbacks;
            status.callbacks = {};
            for (const key in copy) {
                if (copy.hasOwnProperty(key)) {
                    copy[key]();
                }
            }
        }
    };
    return status;
});

export function callLater(fn: Function): number {
    if (!fn) {
        return undefined;
    }
    tickerStatus.idCounter += 1;
    tickerStatus.callbacks[tickerStatus.idCounter] = fn;
    if (!tickerStatus.pending) {
        tickerStatus.pending = true;
        setTimeout(tickerStatus.invokeCallbacks, 0);
    }
    return tickerStatus.idCounter;
}
export function cancelCallLater(id: number) {
    if (isDefined(id)) {
        delete tickerStatus.callbacks[id];
    }
}

const nextFrame = (function () {
    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    const win: any = isBrowser ? window : {};
    let requestAnimationFrame = win.requestAnimationFrame;

    for (let i = 0; i < vendors.length && !win.requestAnimationFrame; ++i) {
        requestAnimationFrame = win[vendors[i] + 'RequestAnimationFrame'];
    }
    if (!requestAnimationFrame) {
        return function (callback) {
            return setTimeout(callback, 16);
        };
    } else {
        return requestAnimationFrame;
    }
})();

const requestFrameStatus = globalCache('internalRequestFrameStatus', () => {
    const status = {
        callbacks: {},
        pending: false,
        idCounter: 1,
        invokeCallbacks: function() {
            status.pending = false;
            const copy = status.callbacks;
            status.callbacks = {};
            for (const key in copy) {
                if (copy.hasOwnProperty(key)) {
                    copy[key]((new Date()).getTime() - copy[key].__startTime);
                }
            }
        }
    };
    return status;
});
export type CancelFrameFunction = () => void;
export type TlapsedTime = number;
export function requestFrame(fn: (elapsedTime: TlapsedTime) => void): CancelFrameFunction {
    if (!fn) {
        return null;
    }
    requestFrameStatus.idCounter += 1;
    const id = requestFrameStatus.idCounter;
    requestFrameStatus.callbacks[id] = fn;
    requestFrameStatus.callbacks[id].__startTime = (new Date()).getTime();
    if (!requestFrameStatus.pending) {
        requestFrameStatus.pending = true;
        nextFrame(requestFrameStatus.invokeCallbacks);
    }
    return () => {
        delete tickerStatus.callbacks[id];
    }
}

export function isPromiseLike(p): boolean {
    return p && ('then' in p) && (typeof p.then === 'function');
}
export function isJQPromise(p): boolean {
    return isPromiseLike(p) && ('fail' in p) && (typeof p.fail === 'function');
}
export function isPromise(p): boolean {
    return isPromiseLike(p) && ('catch' in p) && (typeof p.catch === 'function');
}

export function isObservabeLike(o): boolean {
    return o && ('subscribe' in o) && (typeof o.subscribe === 'function');
}

export function asPromise(p): Promise<any> {
    if (isObservabeLike(p)) {
        return new Promise((resolve, reject) => {
            const subscription = p.subscribe(result => {
                resolve(result);
                // 延迟取消订阅，避免同步调用造成的subscription尚未定义的问题
                callLater(() => subscription.unsubscribe());
            }, error => {
                reject(error);
                // 延迟取消订阅，避免同步调用造成的subscription尚未定义的问题
                callLater(() => subscription.unsubscribe());
            });
        });
    } else if (isPromiseLike(p)) {
        if (isPromise(p)) return p;
        if (isJQPromise(p)) {
            return new Promise((resolve, reject) => {
                p.then(resolve).fail(reject);
            });
        }
    }
    return null;
}