import { emitter, EventEmitter } from '../../../helper/emitter';
import { ClassLike, IInjector, Provider } from '../../../helper/injector';
import { globalLimitedDictionary } from '../../../utils';
import { bindingInjector } from '../../factory/injector';
import { IUIBindingMetadata, IUIState } from '../common/interfaces';

const uiBindingMetadatas = globalLimitedDictionary<IUIBindingMetadata>('ui.binding_metadata_dictionary');

export function isUISelector(selector: any): boolean {
    return typeof selector === 'string' && hasUIBindingMetadata(selector);
}

const complementedMetadata = {};

export function createUIStateInstance(
    selector: string,
    providers?: Provider[],
    parentInjector?: IInjector
): IUIState {
    const metadata: IUIBindingMetadata = getUIBindingMetadata(selector);
    let instance: IUIState;
    const propertyRequired = metadata.properties = metadata.properties || {};
    const emitterRequired = metadata.emitters = metadata.emitters || {};
    const injectRequired = metadata.injects = metadata.injects || {};
    if (typeof metadata.Clazz === 'function') {
        instance = new metadata.Clazz();
        if (!complementedMetadata[selector]) {
            Object.assign(propertyRequired, instance['propertyRequired'] || {});
            Object.assign(emitterRequired, instance['emitterRequired'] || {});
            Object.assign(injectRequired, instance['injectRequired'] || {});
            complementedMetadata[selector] = true;
        }
        delete instance['propertyRequired'];
        delete instance['emitterRequired'];
        delete instance['injectRequired'];
    } else {
        instance = {} as IUIState;
    }
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
    return instance;
}

export function registerUIBindingMetadata(selector: string, metadata: IUIBindingMetadata, Clazz?: ClassLike) {
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
    return uiBindingMetadatas.get(selector);
}
export function findUIBindingMetadata(clazz: ClassLike) {
    return uiBindingMetadatas.find((key, value) => value.Clazz === clazz);
}

