import { ClassLike, IInjector, Provider } from '../../helper/injector';
import { LoggerFactory } from '../../logger';
import { IBindingDefinition, IElementRef, IUIBindingMetadata, StateObject, UIBindingSelector, UIBindingTemplate } from '../compiler/common/interfaces';
import { createElementRef } from '../compiler/refs/element';
import { createDynamicBindingRef, createDynamicBindingRefFromSelector } from '../compiler/refs/template';
import { findUIBindingMetadata, hasUIBindingMetadata, registerUIBindingMetadata } from '../compiler/refs/ui';

const logger = LoggerFactory.getLogger('neurons::ui.UIBindingFactory');

export class UIBindingFactory {
    register(selector: UIBindingSelector, metadata: IUIBindingMetadata, Clazz?: ClassLike): void {
        registerUIBindingMetadata(selector, metadata, Clazz);
    }
    has(selector: UIBindingSelector): boolean {
        return hasUIBindingMetadata(selector);
    }
    create<T extends StateObject>(
        source: UIBindingSelector | UIBindingTemplate | HTMLElement | ClassLike,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parentInjector?: IInjector
    ): IElementRef<T> {
        let bindingRef;
        if (typeof source === 'string' && hasUIBindingMetadata(source)) {
            // selector
            bindingRef = createDynamicBindingRefFromSelector(source, hostBinding, providers, parentInjector);
        } else if (typeof source === 'function') {
            const finded = findUIBindingMetadata(source);
            const selector = finded[0] || 'div';
            bindingRef = createDynamicBindingRefFromSelector(selector, hostBinding, providers, parentInjector);
        } else {
            // template
            bindingRef = createDynamicBindingRef<T>(source, hostBinding, providers, parentInjector);
        }
        return createElementRef(bindingRef, state);
    }
    fromTemplate<T extends StateObject>(
        template: UIBindingTemplate,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parentInjector?: IInjector
    ): IElementRef<T> {
        const bindingRef = createDynamicBindingRef<T>(template, hostBinding, providers, parentInjector);
        return createElementRef(bindingRef, state);
    }
    fromSelector<T extends StateObject>(
        selector: UIBindingSelector,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parentInjector?: IInjector
    ): IElementRef<T> {
        if (!hasUIBindingMetadata(selector)) return null;
        const bindingRef = createDynamicBindingRefFromSelector<T>(selector, hostBinding, providers, parentInjector);
        return createElementRef(bindingRef, state);
    }
}

export const bindingFactory = new UIBindingFactory();