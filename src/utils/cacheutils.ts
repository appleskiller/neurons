import { isBrowser } from './osutils';

declare const global: any;
/**
 * Window or Global or {};
 */
export const globalContext: any = isBrowser ? window
                                            : (typeof global !== 'undefined') ? global
                                            : {};
const __cache = {};
globalContext.__NE_GLOBAL__ = globalContext.__NE_GLOBAL__ || {
    cache: function (key, defaultValue) {
        if (!key) return null;
        if (!__cache[key]) {
            __cache[key] = (typeof defaultValue === 'function') ? defaultValue() : (defaultValue || {});
        }
        return __cache[key];
    }
};
/**
 * example:
 * ```
 * const obj = globalCache('someName', { });
 * ```
 * or
 * ```
 * const obj = globalCache('someName', () => { });
 * ```
 */
export const globalCache = globalContext.__NE_GLOBAL__.cache;

export interface ILimitedDictionary<T> {
    has: (key: string) => boolean;
    get: (key: string) => T;
    set: (key: string, value: T) => void;
    find: (fn: ((key: string, value: T) => boolean)) => [string, T];
}
const limitedDictionaryConstructor = function () {
    const dic = {};
    const keys = [];
    const maxLength = 5000;
    const result = {
        has: function (key) {
            return !!(key in dic);
        },
        get: function (key) {
            return dic[key];
        },
        set: function (key, value) {
            if (!(key in dic)) {
                keys.push(key);
            }
            dic[key] = value;
            if (keys.length > 5000) {
                const deleted = keys.shift();
                delete dic[deleted];
            }
        },
        find: function(fn: (key, value) => boolean) {
            let findedValue;
            const key = Object.keys(dic).find(key => {
                const result = fn(key, dic[key]);
                if (result) {
                    findedValue = dic[key];
                }
                return result;
            });
            if (key !== undefined) {
                return [key, findedValue];
            } else {
                return undefined;
            }
        }
    }
    return result;
}
export function globalLimitedDictionary<T>(key: string): ILimitedDictionary<T> {
    return globalCache(key, limitedDictionaryConstructor);
}