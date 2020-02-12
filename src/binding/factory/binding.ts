import { emitter, EventEmitter } from 'neurons-emitter';
import { ClassLike, IInjector, Provider } from 'neurons-injector';
import { globalLimitedDictionary, isEmpty } from 'neurons-utils';
import { bindingInjector } from './injector';
import { IBindingMetadata, ILogicBindingMetadata, IAttributeBindingMetadata } from '../common/interfaces';

const uiBindingMetadatas = globalLimitedDictionary<IBindingMetadata>('ui.binding_metadata_dictionary');
const uiLogicBindingMetadatas = globalLimitedDictionary<ILogicBindingMetadata>('ui.logic_binding_metadata_dictionary');
const uiAttributeBindingMetadatas = globalLimitedDictionary<IAttributeBindingMetadata>('ui.attr_binding_metadata_dictionary');

export function isUISelector(selector: any): boolean {
    return typeof selector === 'string' && hasUIBindingMetadata(selector);
}

export function createUIBindingInstance(
    selector: string,
    providers?: Provider[],
    parentInjector?: IInjector
): any {
    const metadata: IBindingMetadata = getUIBindingMetadata(selector);
    let instance;
    if (typeof metadata.Clazz === 'function') {
        instance = new metadata.Clazz();
    } else {
        instance = {};
    }
    injectInstance(instance, metadata, providers, parentInjector);
    return instance;
}

export function createAttributeBindingInstance(
    selector: string,
    providers?: Provider[],
    parentInjector?: IInjector
): any {
    const metadata: IAttributeBindingMetadata = getAttributeBindingMetadata(selector);
    let instance;
    const propertyRequired = metadata.properties = metadata.properties || {};
    const emitterRequired = metadata.emitters = metadata.emitters || {};
    const injectRequired = metadata.injects = metadata.injects || {};
    if (typeof metadata.Clazz === 'function') {
        instance = new metadata.Clazz();
        if (!complementedAttributeMetadata[selector]) {
            Object.assign(propertyRequired, instance['propertyRequired'] || {});
            Object.assign(emitterRequired, instance['emitterRequired'] || {});
            Object.assign(injectRequired, instance['injectRequired'] || {});
            complementedAttributeMetadata[selector] = true;
        }
        delete instance['propertyRequired'];
        delete instance['emitterRequired'];
        delete instance['injectRequired'];
    } else {
        instance = {};
    }
    injectInstance(instance, metadata, providers, parentInjector);
    return instance;
}

function injectInstance(
    instance: any,
    metadata: IBindingMetadata | IAttributeBindingMetadata,
    providers?: Provider[],
    parentInjector?: IInjector
) {
    const emitterRequired = metadata.emitters = metadata.emitters || {};
    const injectRequired = metadata.injects = metadata.injects || {};
    // 处理事件注入作为输出
    if (emitterRequired) {
        instance['__emitter'] = new EventEmitter();
        for (const key in emitterRequired) {
            const eventName = emitterRequired[key];
            try {
                // 如果为方法
                if (typeof instance[key] === 'function') {
                    const oriMethod = instance[key];
                    instance[key] = function () {
                        const result = oriMethod.apply(this, arguments);
                        this['__emitter'].emit(eventName, result, this);
                        return result;
                    };
                } else {
                    instance[key] = emitter(eventName, instance['__emitter']);
                }
            } catch (error) { }
        }
    }
    // 填充注入器
    parentInjector = parentInjector || bindingInjector;
    const injector = parentInjector.create(providers || []);
    instance.injector = injector;
    // 处理属性注入需求
    if (injectRequired) {
        for (const key in injectRequired) {
            const token = injectRequired[key];
            try {
                instance[key] = injector.get(token);
            } catch (error) { }
        }
    }
}
// -------------------------------------------------
// UI Binding
// =================================================
const complementedMetadata = {};
function resolveBindingMetadata(selector, metadata: IBindingMetadata): IBindingMetadata {
    if (metadata && !complementedMetadata[selector] && typeof metadata.Clazz === 'function') {
        const propertyRequired = metadata.properties = metadata.properties || {};
        const emitterRequired = metadata.emitters = metadata.emitters || {};
        const injectRequired = metadata.injects = metadata.injects || {};
        Object.assign(propertyRequired, metadata.Clazz.prototype['propertyRequired'] || {});
        Object.assign(emitterRequired, metadata.Clazz.prototype['emitterRequired'] || {});
        Object.assign(injectRequired, metadata.Clazz.prototype['injectRequired'] || {});
        complementedMetadata[selector] = true;
    }
    return metadata;
}
export function registerUIBindingMetadata(selector: string, metadata: IBindingMetadata, Clazz?: ClassLike) {
    if (!metadata || !selector) {
        throw new Error(`Invalid parameters: 'metadata' or 'selector'`);
    }
    let exists;
    if (!uiBindingMetadatas.has(selector)) {
        exists = {};
        uiBindingMetadatas.set(selector, exists);
    } else {
        exists = uiBindingMetadatas.get(selector);
    }
    Object.assign(exists, metadata);
    Clazz && (exists.Clazz = Clazz);
}
export function hasUIBindingMetadata(selector: string): boolean {
    return (selector && !!uiBindingMetadatas.get(selector));
}
export function getUIBindingMetadata(selector: string) {
    const metadata = uiBindingMetadatas.get(selector);
    return resolveBindingMetadata(selector, metadata);
}
export function findUIBindingMetadata(clazz: ClassLike) {
    const result = uiBindingMetadatas.find((key, value) => value.Clazz === clazz);
    if (result && result.length) {
        result[1] = resolveBindingMetadata(result[0], result[1]);
    }
    return result;
}
// -------------------------------------------------
// Attrbutes Binding
// =================================================
export interface IAttributeBindingMatch {
    attribute: string;
    selector: string;
    metadata: IAttributeBindingMetadata;
}

const complementedAttributeMetadata = {};
function resolveAttributeMetadata(selector, metadata: IAttributeBindingMetadata): IAttributeBindingMetadata {
    if (metadata && !complementedAttributeMetadata[selector] && typeof metadata.Clazz === 'function') {
        const propertyRequired = metadata.properties = metadata.properties || {};
        const emitterRequired = metadata.emitters = metadata.emitters || {};
        const injectRequired = metadata.injects = metadata.injects || {};
        Object.assign(propertyRequired, metadata.Clazz.prototype['propertyRequired'] || {});
        Object.assign(emitterRequired, metadata.Clazz.prototype['emitterRequired'] || {});
        Object.assign(injectRequired, metadata.Clazz.prototype['injectRequired'] || {});
        complementedAttributeMetadata[selector] = true;
    }
    return metadata;
}

export function registerAttributeBindingMetadata(selector: string, metadata: IAttributeBindingMetadata, Clazz?: ClassLike) {
    if (!metadata || !selector) {
        throw new Error(`Invalid parameters: 'metadata' or 'selector'`);
    }
    let exists;
    if (!uiAttributeBindingMetadatas.has(selector)) {
        exists = {};
        uiAttributeBindingMetadatas.set(selector, exists);
    } else {
        exists = uiAttributeBindingMetadatas.get(selector);
    }
    Object.assign(exists, metadata);
    Clazz && (exists.Clazz = Clazz);
}

export function hasAttributeBindingMetadata(selector: string): boolean {
    return (selector && !!uiAttributeBindingMetadatas.get(selector));
}

export function matchAttributeBindingMetadata(tagname: string, attrs: any): { [attribute: string]: IAttributeBindingMatch } {
    if (!attrs) return null;
    const results = {};
    let attribute;
    uiAttributeBindingMetadatas.find((key, value) => {
        value = resolveAttributeMetadata(key, value);
        if (key.charAt(key.length - 1) === ']') {
            if (key.charAt(0) === '[') {
                attribute = key.substr(1, key.length - 2);
                !!attrs[attribute] && (results[attribute] = {
                    selector: key,
                    attribute: attribute,
                    metadata: value,
                })
            } else {
                const index = key.indexOf('[');
                attribute = key.substring(index + 1, key.length - 1);
                index !== -1 && tagname === key.substring(0, index) && !!attrs[attribute] && (results[attribute] = {
                    selector: key,
                    attribute: attribute,
                    metadata: value,
                })
            }
        } else {
            attribute = key;
            !!attrs[key] && (results[attribute] = {
                selector: key,
                attribute: attribute,
                metadata: value,
            })
        }
        return false;
    });
    return isEmpty(results) ? null : results;
}

export function getAttributeBindingMetadata(selector: string) {
    const metadata = uiAttributeBindingMetadatas.get(selector);
    return resolveAttributeMetadata(selector, metadata);
}
export function findAttributeBindingMetadata(clazz: ClassLike) {
    const result = uiAttributeBindingMetadatas.find((key, value) => value.Clazz === clazz);
    if (result && result.length) {
        result[1] = resolveAttributeMetadata(result[0], result[1]);
    }
    return result;
}
// -------------------------------------------------
// Logic Binding
// =================================================
export function registerLogicBindingMetadata(selector: string, metadata: ILogicBindingMetadata, Clazz?: ClassLike) {
    if (!metadata || !selector) {
        throw new Error(`Invalid parameters: 'metadata' or 'selector'`);
    }
    let exists;
    if (!uiLogicBindingMetadatas.has(selector)) {
        exists = {};
        uiLogicBindingMetadatas.set(selector, exists);
    } else {
        exists = uiLogicBindingMetadatas.get(selector);
    }
    Object.assign(exists, metadata);
    Clazz && (exists.Clazz = Clazz);
}

export function hasLogicBindingMetadata(selector: string): boolean {
    return (selector && !!uiLogicBindingMetadatas.get(selector));
}
export function getLogicBindingMetadata(selector: string) {
    return uiLogicBindingMetadatas.get(selector);
}
export function findLogicBindingMetadata(clazz: ClassLike) {
    return uiBindingMetadatas.find((key, value) => value.Clazz === clazz);
}