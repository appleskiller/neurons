const funcProto = Function.prototype;
const objectProto = Object.prototype;
const funcToString = funcProto.toString;
const hasOwnProperty = objectProto.hasOwnProperty;
const objectCtorString = funcToString.call(Object);
const objectToString = objectProto.toString;

export function isDefined(obj: any): boolean {
    return obj !== undefined && obj !== null;
}
export function isArray(obj: any): boolean {
    return obj && objectToString.call(obj) === '[object Array]';
}
export function isDate(obj: any): boolean {
    return obj && objectToString.call(obj) === '[object Date]';
}
export function isArrayBuffer(value: any): value is ArrayBuffer {
    return typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;
}
export function isBlob(value: any): value is Blob {
    return typeof Blob !== 'undefined' && value instanceof Blob;
}
export function isFormData(value: any): value is FormData {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}
function isHostObject(value) {
    var result = false;
    if (value != null && typeof value.toString != 'function') {
        try {
        result = !!(value + '');
        } catch (e) {}
    }
    return result;
}
function overArg(func, transform) {
    return function(arg) {
        return func(transform(arg));
    };
}
var getPrototype = overArg(Object.getPrototypeOf, Object);
export function isPlainObject(value) {
    if (!value || typeof value !== 'object' || objectToString.call(value) != '[object Object]' || isHostObject(value)) {
      return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return (typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
  }
export function isEmpty(obj: any): boolean {
    if (isDefined(obj)) {
        if (isArray(obj)) {
            return !obj.length;
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function createDate(v): Date {
    if (isDate(v)) return v;
    if (typeof v === 'number') {
        const d = new Date();
        d.setTime(v);
        return d;
    }
    return new Date(v);
}

export function getDateTime(v: any): number {
    if (!isDefined(v)) return NaN;
    let type = typeof v;
    if (type === 'string') {
        if (v.length === 13 && v === parseInt(v) + '') {
            return parseInt(v);
        } else {
            return (new Date(v)).getTime();
        }
    };
    if (type === 'number') {
        if ((v + '').length === 13) return v;
        return (new Date(v + '')).getTime();
    };
    try { return v.getTime() } catch (error) { return NaN };
}
const dateReplaced = {'零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '年': '/', '月': '/', '日': '/', '时': ':', '分': ':', '秒': ':',
}
const dateReplacedRegExp = /[零|〇|一|二|三|四|五|六|七|八|九|年|月|日|时|分|秒]/g;
export function getDateTimeFromString(v: string): number {
    let time = getDateTime(v);
    if (!isNaN(time)) return time;
    if (dateReplacedRegExp.test(v)) {
        v = v.replace(dateReplacedRegExp, (word) => {
            return (word in dateReplaced) ? dateReplaced[word] : word;
        });
        time = getDateTime(v);
    }
    return time;
}
export function getQuarterNumber(d: Date) {
    const m = d.getMonth();
    if(2 < m && m < 6){
        return 1;
    } else if(5 < m && m < 9){
        return 2;
    } else if(m > 8){
        return 3;
    }
    return 0;
}