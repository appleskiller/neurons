import { globalCache } from './cacheutils';
import { isDate, isArray, isEmpty, isDefined, isPlainObject } from './typeutils';
import { isBrowser } from './osutils';

const counter = globalCache('uniqueCounter', {
    count: 0
});
export function uniqueId(prefix: string) {
    counter.count += 1;
    return prefix + '_' + counter.count;
}

/**
 * 合并对象。
 * 深合并两个或更多的对象，并返回一个新的对象。
 * 如果第一个参数为true，则第二个对象的内容将拷贝到第一个对象上。
 * 注意：与jQuery.extend(true)不同的是
 * 1. 不深度合并数组对象
 * 2. 不复制原型链上的属性。
 */
export function merge(...args): any {
    let i,
        len,
        ret = {};
    const doCopy = function (copy, original) {
            if (typeof original !== 'object') {
                return original;
            }
            let value, key;
            if (typeof copy !== 'object') {
                copy = {};
            }

            for (key in original) {
                if (original.hasOwnProperty(key)) {
                    value = original[key];
                    if (value && typeof value === 'object' && !isDate(value)) {
                        if (!isArray(value)) {
                            // 如果copy[key]值不是object，则直接赋值
                            if (!copy[key] || typeof copy[key] !== 'object' || isDate(copy[key])) {
                                copy[key] = {};
                            }
                            copy[key] = doCopy(copy[key] || {}, value);
                        } else {
                            if (!copy[key] || !isArray(copy[key])) {
                                copy[key] = [];
                            }
                            copy[key] = copy[key] || [];
                            for (let index = 0; index < value.length; index++) {
                                if (value[index] && typeof value[index] === 'object' && !isArray(value[index]) && !isDate(value[index])) {
                                    copy[key][index] = doCopy(copy[key][index] || {}, value[index]);
                                } else {
                                    copy[key][index] = value[index];
                                }
                            }
                            copy[key].length = value.length;
                        }
                    } else {
                        copy[key] = value;
                    }
                }
            }
            return copy;
        };
    // 如果第一个参数为true
    if (args[0] === true) {
        ret = args[1];
        args = Array.prototype.slice.call(args, 2);
    }
    len = args.length;
    for (i = 0; i < len; i++) {
        ret = doCopy(ret, args[i]);
    }
    return ret;
}

/**
 * Diffs merge 比较值变更，从source向target复制值。
 * 对于发生变更的叶子属性，将向根逐层执行浅复制
 * @author AK
 * @param target 目标对象
 * @param source 源对象
 * @returns 返回变化信息
 */
export function diffMerge(target, source): any {
    if (typeof source !== 'object' || typeof target !== 'object') {
        return null;
    }
    const sourceIsArray = isArray(source);
    const targetIsArray = isArray(target);
    if ((targetIsArray && !sourceIsArray) || (!targetIsArray && sourceIsArray)) {
        return null;
    }
    const collect = function (token, oldValue, newValue) {
        if (!target && !source) return;
        // token.changes[token.current.join('.')] = {
        //     oldValue: oldValue,
        //     newValue: newValue
        // }
        const last = token.current[token.current.length - 1];
        let obj = token.object;
        for (let i = 0; i < token.current.length - 1; i++) {
            const key = token.current[i];
            if (key in obj) {
                obj = obj[key];
            } else {
                obj = obj[key] = {};
            }
        }
        obj[last] = true;
    }
    const collecting = function (copy, original, token) {
        const oriIsDate = isDate(original);
        const oriIsArray = isArray(original);
        const oriIsObject = isPlainObject(original);
        if (oriIsDate && isDate(copy)) {
            if (copy.getTime() !== original.getTime()) {
                collect(token, copy, original);
            }
        } else if (oriIsArray && isArray(copy)) {
            collectArray(copy, original, token);
        } else if (original && oriIsObject && copy && typeof copy === 'object') {
            collectObject(copy, original, token);
        } else if (copy !== original) {
            collect(token, copy, original);
        }
    }
    const collectArray = function (copy, original, token) {
        for (let i = 0; i < original.length; i++) {
            token.current.push(i);
            collecting(copy[i], original[i], token);
            token.current.pop();
        }
        if (copy.length !== original.length) {
            token.current.push('length');
            collect(token, copy.length, original.length);
            token.current.pop();
        }
    }
    const collectObject = function (copy, original, token) {
        for (let key in original) {
            token.current.push(key);
            collecting(copy[key], original[key], token);
            token.current.pop();
        }
    };
    const token = {changes: {}, current: [], object: {}};
    if (isArray(source)) {
        collectArray(target, source, token);
    } else {
        collectObject(target, source, token);
    }
    // 更新值
    const mergeByMap = function (mapping, currentTarget, currentSource, depth) {
        for (const key in mapping) {
            if (depth === 0) {
                // 只采集1级属性变更
                token.changes[key] = {
                    oldValue: currentTarget[key],
                    newValue: currentSource[key]
                }
            }
            if (mapping[key] === true) {
                currentTarget[key] = currentSource[key];
            } else {
                if (isArray(currentTarget[key])) {
                    currentTarget[key] = [ ...currentTarget[key] ];
                } else {
                    currentTarget[key] = { ...currentTarget[key] };
                }
                mergeByMap(mapping[key], currentTarget[key], currentSource[key], depth + 1);
            }
        }
    }
    mergeByMap(token.object, target, source, 0);
    return token.changes;
}

/**
 * Deeps equal
 * @author AK
 * @param obj1 
 * @param obj2 
 * @returns  
 */
export function deepEqual(obj1, obj2) {
    const type1 = typeof obj1;
    const type2 = typeof obj2;
    if (type1 !== type2) return false;
    if (type1 === 'object') {
        // array
        const isArr1 = isArray(obj1);
        const isArr2 = isArray(obj2)
        if (isArr1 && isArr1) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) { if (!deepEqual(obj1[i], obj2[i])) return false; }
            return true;
        } else if (isArr1 || isArr2) {
            return false;
        }
        // date
        const isDate1 = obj1 instanceof Date;
        const isDate2 = obj2 instanceof Date;
        if (isDate1 && isDate2){
            return obj1.getTime() === obj2.getTime();
        } else if (isDate1 || isDate1) {
            return false;
        }
        // null
        if (obj1 === null || obj2 === null) {
            return obj1 === obj2;
        }
        // object
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (let j = 0; j < keys1.length; j++) {
            if (!(keys1[j] in obj2)) return false;
            if (!deepEqual(obj1[keys1[j]], obj2[keys1[j]])) return false;
        }
        return true;
    } else {
        return obj1 === obj2;
    }
}
// ----------------------------------------------------
// copy target from source by mapping
// ====================================================

export const INVALID_PROPERTY_ACCESS = '__INVALID_PROPERTY_ACCESS__';

export interface IObjectAccessor {
    get(propertyChain: string, defaultValue?: any): any;
    union(props: string[]): any[];
    set(propertyChain: string, value: any): void;
    sub(propertyChain: string): SubObjectAccessor;
    copyFrom(sourceAccessor: ObjectAccessor, mappings?: IConverterOption);
}


export class SubObjectAccessor implements IObjectAccessor {
    constructor(public hostProperty: string, public host: ObjectAccessor) {}
    get(propertyChain: string, defaultValue?: any): any {
        if (arguments.length > 1) {
            return this.host.get(`${this.hostProperty}.${propertyChain}`, defaultValue);
        } else {
            return this.host.get(`${this.hostProperty}.${propertyChain}`);
        }
    }
    union(props: string[]): any[] {
        return this.host.union(props.map((p) => `${this.hostProperty}.${p}`));
    }
    set(propertyChain: string, value: any): void {
        return this.host.set(`${this.hostProperty}.${propertyChain}`, value);
    }
    sub(propertyChain: string): SubObjectAccessor {
        return new SubObjectAccessor(`${this.hostProperty}.${propertyChain}`, this.host);
    }
    copyFrom(sourceAccessor: IObjectAccessor, mappings?: IConverterOption) {
        if (!sourceAccessor) {
            return;
        }
        if (!mappings) {
            this.host.copyFrom(sourceAccessor);
        } else {
            const fullMappings = normalizeMappings(mappings);
            obtainSourceValue(sourceAccessor, fullMappings);
            applyTargetValue(sourceAccessor, this, fullMappings);
        }
    }
}

export class ObjectAccessor implements IObjectAccessor {
    constructor(public object) {}
    private _history = {};
    static INVALID_PROPERTY_ACCESS = INVALID_PROPERTY_ACCESS;
    static get(object, pointer) {
        const accessor = new ObjectAccessor(object);
        return accessor.get(pointer);
    }
    get(propertyChain: string, defaultValue?: any): any {
        if (!propertyChain) {
            return this.object;
        }
        if (this._history[propertyChain]) {
            return this._history[propertyChain];
        }
        const splited = this._splitChainProp(propertyChain);
        const prop = splited[1];
        if (!prop) {
            return INVALID_PROPERTY_ACCESS;
        }
        let previous;
        if (arguments.length > 1) {
            previous = this._getOrCreate(splited[0]);
            if (previous && previous !== INVALID_PROPERTY_ACCESS) {
                if (!(prop in previous)) {
                    previous[prop] = defaultValue;
                }
                this._history[propertyChain] = previous[prop];
                return previous[prop];
            }
        } else {
            previous = this.get(splited[0]);
            if (previous && (typeof previous === 'object') && (prop in previous)) {
                this._history[propertyChain] = previous[prop];
                return previous[prop];
            }
        }
        return INVALID_PROPERTY_ACCESS;
    }
    union(props: string[]): any[] {
        if (!props) {
            return null;
        }
        return props.map((prop) => this.get(prop));
    }
    set(propertyChain: string, value: any): void {
        if (propertyChain) {
            const splited = this._splitChainProp(propertyChain);
            const obj = this._getOrCreate(splited[0]);
            if (obj && obj !== INVALID_PROPERTY_ACCESS) {
                try {
                    obj[splited[1]] = value;
                    this._history[propertyChain] = value;
                } catch (err) {}
            }
        }
    }
    sub(propertyChain: string): SubObjectAccessor {
        return new SubObjectAccessor(propertyChain, this);
    }
    /**
     * 按指定mappings深复制属性值。如果不设置mapping则深复制对象
     * @param sourceAccessor 源存取器
     * @param mappings 属性映射表
     */
    copyFrom(sourceAccessor: IObjectAccessor, mappings?: IConverterOption) {
        if (!sourceAccessor) {
            return;
        }
        const sourceObject = sourceAccessor instanceof ObjectAccessor ? (sourceAccessor as ObjectAccessor).object : (sourceAccessor as SubObjectAccessor).host.object;
        if (!sourceObject) {
            return;
        }
        if (!mappings) {
            this.object = merge(true, this.object || {}, sourceObject);
        }
        const fullMappings = normalizeMappings(mappings);
        // 计算sourceValue
        obtainSourceValue(sourceAccessor, fullMappings);
        // 复制
        applyTargetValue(sourceAccessor, this, fullMappings);
    }
    private _getOrCreate(propertyChain: string): any {
        if (!propertyChain) {
            return this.object;
        }
        if (this._history[propertyChain]) {
            return this._history[propertyChain];
        }
        const splited = this._splitChainProp(propertyChain);
        if (!splited[1]) {
            return INVALID_PROPERTY_ACCESS;
        }
        const previous = this._getOrCreate(splited[0]);
        const prop = splited[1];
        if (previous && (typeof previous === 'object')) {
            if (!previous[prop] || (typeof previous[prop] !== 'object')) {
                previous[prop] = {};
            }
            this._history[propertyChain] = previous[prop];
            return previous[prop];
        } else {
            return INVALID_PROPERTY_ACCESS;
            // throw new Error(`Can't access by chaining property name: ${propertyChain}`);
        }
    }
    private _splitChainProp(propertyChain: string): string[] {
        const ind = propertyChain.lastIndexOf('.');
        return [propertyChain.substring(0, ind), propertyChain.substr(ind + 1)];
    }
}

export type IValueConverter = (value: any, sourceAccessor: IObjectAccessor, targetAccessor: IObjectAccessor) => any;
/**
 * 基本的转换器映射
 */
export interface ICommonMapping {
    /**
     * 目标对象属性名
     */
    targetProperty?: string;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 子属性映射描述，只允许出现在源值为对象类型情况下
 */
export interface ISubMapping {
    /**
     * 目标对象属性名
     */
    targetProperty: string;
    /**
     * 子属性映射描述
     */
    subMappings: '*' | IConverterOption;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 子元素映射描述，只允许出现在源值为数组类型的情况下
 */
export interface IItemMapping {
    /**
     * 目标对象属性名
     */
    targetProperty: string;
    /**
     * 子元素映射描述
     */
    itemMappings: '*' | IConverterOption;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 转换器设置。设置如何转换源属性值到目标属性
 */
export interface IConverterOption {
    [sourceProperty: string]: string | IValueConverter | ICommonMapping | ISubMapping | IItemMapping;
}

export interface IConverterMapping {
    sourceProperty: string;
    targetProperty: string;
    converter?: IValueConverter;
    sourceValue?: any;
    skipSetter?: boolean;
    // 子属性映射描述，只允许出现在值为对象类型情况下
    subMappings?: '*' | IConverterOption;
    // 子元素映射描述，只允许出现在值为数组类型的情况下
    itemMappings?: '*' | IConverterOption;
}

// export interface IConverterMappingProcessor {
//     mappings(): IConverterMapping[];
//     sortedSourceMappings(): IConverterMapping[];
//     sortedTargetMappings(): IConverterMapping[];
// }

// export class ConverterMappingProcessor implements IConverterMappingProcessor {
//     constructor(private option: IConverterOption) {}
//     private _mappings: IConverterMapping[];
//     private _sortedSourceMappings: IConverterMapping[];
//     private _sortedTargetMappings: IConverterMapping[];
//     mappings(): IConverterMapping[] {
//         if (!this._mappings) {
//             this._mappings = [];
//             if (this.option) {
//                 this._mappings = normalizeMappings(this.option);
//             }
//         }
//         return this._mappings;
//     }
//     sortedSourceMappings(): IConverterMapping[] {
//         if (!this._sortedSourceMappings) {
//             this._sortedSourceMappings = this.mappings().concat();
//             this._sortedSourceMappings.sort((a, b): number => {
//                 return a.sourceProperty.length - b.sourceProperty.length;
//             });
//         }
//         return this._sortedSourceMappings;
//     }
//     sortedTargetMappings(): IConverterMapping[] {
//         if (!this._sortedTargetMappings) {
//             this._sortedTargetMappings = this.mappings().concat();
//             this._sortedTargetMappings.sort((a, b): number => {
//                 return a.targetProperty.length - b.targetProperty.length;
//             });
//         }
//         return this._sortedTargetMappings;
//     }
// }

function normalizeMappings(mappings?: IConverterOption): IConverterMapping[] {
    const result: IConverterMapping[] = [];
    let value, map: IConverterMapping;
    for (const sourceProperty in mappings) {
        value = mappings[sourceProperty];
        if (!value || (typeof value === 'string')) {
            // 对拷属性
            map = {
                sourceProperty: sourceProperty,
                targetProperty: value || sourceProperty
            };
        } else if (typeof value === 'function') {
            // 通过转换函数对拷属性
            map = {
                sourceProperty: sourceProperty,
                targetProperty: sourceProperty,
                converter: value
            };
        } else if (value.targetProperty || value.converter) {
            // 如果不设置targetProperty则认为是自行处理转换
            map = {
                sourceProperty: value.sourceProperty || sourceProperty,
                targetProperty: value.targetProperty || sourceProperty,
                converter: value.converter,
                skipSetter: value.skipSetter,
                subMappings: value.subMappings,
                itemMappings: value.itemMappings
            };
        } else {
            map = null;
        }
        map && result.push(map);
    }
    return result;
}

function collectObjectMapping(object): IConverterOption {
    if (!object) {
        return {};
    }
    const mapping: IConverterOption = {};
    let propertyChain, index = 0, i, key, obj = object;
    const arr = [{ propertyChain: '', object: obj }];
    while (index < arr.length) {
        propertyChain = arr[index].propertyChain;
        obj = arr[index].object;
        if (isArray(obj)) {
            for (i = 0; i < obj.length; i++) {
                arr.push({
                    propertyChain: propertyChain ? `${propertyChain}.${i}` : `${i}`,
                    object: obj[i]
                });
            }
        } else if (typeof obj === 'object' && !isDate(obj)) {
            for (key in obj) {
                arr.push({
                    propertyChain: propertyChain ? `${propertyChain}.${key}` : `${key}`,
                    object: obj[key]
                });
            }
        } else {
            propertyChain && (mapping[propertyChain] = propertyChain);
        }
        index += 1;
    }
    return mapping;
}
function obtainSourceValue(sourceAccessor: IObjectAccessor, mappings: IConverterMapping[]) {
    mappings = mappings || [];
    // sort by source prop length
    mappings.sort((a, b): number => {
        return a.sourceProperty.length - b.sourceProperty.length;
    });
    mappings.forEach((map: IConverterMapping) => {
        map.sourceValue = sourceAccessor.get(map.sourceProperty);
    });
}

function applyTargetValue(sourceAccessor: IObjectAccessor, targetAccessor: IObjectAccessor, mappings: IConverterMapping[]) {
    mappings = mappings || [];
    // sort by target prop length
    mappings.sort((a, b): number => {
        return a.targetProperty.length - b.targetProperty.length;
    });
    mappings.forEach((map: IConverterMapping) => {
        if (map.sourceValue !== INVALID_PROPERTY_ACCESS) {
            const subMappings = map.subMappings;
            const itemMappings = map.itemMappings;
            let targetValue;
            if (map.sourceValue && isArray(map.sourceValue)) {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : targetAccessor.get(map.targetProperty, []);
                targetValue = targetValue || [];
                if (targetValue !== INVALID_PROPERTY_ACCESS) {
                    (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
                    for (let i = 0; i < map.sourceValue.length; i++) {
                        if (!map.sourceValue[i] || typeof map.sourceValue[i] !== 'object') {
                            targetAccessor.set(`${map.targetProperty}.${i}`, map.sourceValue[i]);
                            continue;
                        }
                        // ensure target item
                        targetAccessor.get(`${map.targetProperty}.${i}`, {});
                        if (itemMappings === '*') {
                            merge(true, targetAccessor.get(`${map.targetProperty}.${i}`, {}), map.sourceValue[i]);
                        } else if (itemMappings) {
                            targetAccessor.sub(`${map.targetProperty}.${i}`)
                                        .copyFrom(sourceAccessor.sub(`${map.sourceProperty}.${i}`), itemMappings);
                        }
                    }
                    // TODO cut off?
                    targetValue.length = map.sourceValue.length;
                }
            } else if (map.sourceValue && typeof map.sourceValue === 'object') {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : targetAccessor.get(map.targetProperty, {});
                targetValue = targetValue || {};
                if (targetValue !== INVALID_PROPERTY_ACCESS) {
                    (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
                    if (subMappings === '*') {
                        merge(true, targetAccessor.get(map.targetProperty, {}), map.sourceValue);
                    } else if (subMappings) {
                        targetAccessor.sub(map.targetProperty)
                                    .copyFrom(sourceAccessor.sub(map.sourceProperty), subMappings);
                    }
                }
            } else {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : map.sourceValue;
                (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
            }
        }
    });
}

/**
 * 通过转换映射对象从源对象中复制属性值到目标对象，如果不传递转换映射对象则相当于merge方法，及拷贝所有属性及子属性。
 * @param target 目标对象
 * @param source 源对象
 * @param mappings 转换映射对象
 */
export function copyTo(target: Object, source: Object, mappings?: IConverterOption): any {
    if (!source) {
        return target;
    }
    if (!mappings) {
        return merge(true, target || {}, source);
    }
    target = target || {};
    const fullMappings: IConverterMapping[] = normalizeMappings(mappings);
    const sourceAccessor = new ObjectAccessor(source);
    const targetAccessor = new ObjectAccessor(target);
    obtainSourceValue(sourceAccessor, fullMappings);
    applyTargetValue(sourceAccessor, targetAccessor, fullMappings);
    return target;
}

/**
 * 继承属性值。与copyTo方法不同之处在于，对于自身对象不存在的属性将跳过从source继承值
 * @param target 目标对象
 * @param source 源对象
 */
export function extendsTo(target: Object, source: Object): any {
    if (!source || !target) {
        return target;
    }
    const mapping = collectObjectMapping(target);
    const sourceAccessor = new ObjectAccessor(source);
    const targetAccessor = new ObjectAccessor(target);
    targetAccessor.copyFrom(sourceAccessor, mapping);
    return targetAccessor.object;
}