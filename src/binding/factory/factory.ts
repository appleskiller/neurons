import { ClassLike, IInjector, Provider } from 'neurons-injector';
import { IBindingDefinition, IBindingRef, IBindingMetadata, StateObject, BindingSelector, BindingTemplate, IUIState, ILogicBindingMetadata, LogicBindingSelector, INeBindingRef, IAttributeBindingMetadata, AttributeBindingSelector, IAttributeBindingDefinition } from '../common/interfaces';
import { wrapNeBindingRef } from '../refs/element';
import { findUIBindingMetadata, hasUIBindingMetadata, registerUIBindingMetadata, registerLogicBindingMetadata, hasLogicBindingMetadata, registerAttributeBindingMetadata, hasAttributeBindingMetadata } from './binding';
import { bindTemplate, bindSelector, bindElement, bindSource } from '../compiler';

// -------------------------------------------------
// UI Binding
// =================================================
export class UIBindingFactory {
    register(selector: BindingSelector, metadata: IBindingMetadata, Clazz?: ClassLike): void {
        registerUIBindingMetadata(selector, metadata, Clazz);
    }
    has(selector: BindingSelector): boolean {
        return hasUIBindingMetadata(selector);
    }
    create<T extends IUIState>(
        source: BindingSelector | BindingTemplate | HTMLElement | ClassLike,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parent?: INeBindingRef,
        parentInjector?: IInjector
    ): IBindingRef<T> {
        const bindingRef = bindSource(source, hostBinding, providers, parent, parentInjector);
        state && bindingRef.bind(state);
        return wrapNeBindingRef<T>(bindingRef);
    }
    fromTemplate<T extends StateObject>(
        template: BindingTemplate,
        state?: T,
        providers?: Provider[],
        parent?: INeBindingRef,
        parentInjector?: IInjector
    ): IBindingRef<T> {
        const bindingRef = bindTemplate(template, providers, parent, parentInjector);
        state && bindingRef.bind(state);
        return wrapNeBindingRef<T>(bindingRef);
    }
    fromSelector<T extends StateObject>(
        selector: BindingSelector,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parent?: INeBindingRef,
        parentInjector?: IInjector
    ): IBindingRef<T> {
        if (!hasUIBindingMetadata(selector)) return null;
        const bindingRef = bindSelector(selector, hostBinding, providers, parent, parentInjector);
        state && bindingRef.bind(state);
        return wrapNeBindingRef<T>(bindingRef);
    }
    fromElement<T extends StateObject>(
        element: HTMLElement,
        state?: T,
        hostBinding?: IBindingDefinition,
        providers?: Provider[],
        parent?: INeBindingRef,
        parentInjector?: IInjector
    ): IBindingRef<T> {
        const bindingRef = bindElement(element, hostBinding, providers, parent, parentInjector);
        state && bindingRef.bind(state);
        return wrapNeBindingRef<T>(bindingRef);
    }
}

export const bindingFactory = new UIBindingFactory();

// -------------------------------------------------
// Attrbutes Binding
// =================================================
export class UIAttributeBindingFactory {
    register(selector: AttributeBindingSelector, metadata: IAttributeBindingMetadata, Clazz?: ClassLike): void {
        registerAttributeBindingMetadata(selector, metadata, Clazz);
    }
    has(selector: AttributeBindingSelector): boolean {
        return hasAttributeBindingMetadata(selector);
    }
}
export const attributeBindingFactory = new UIAttributeBindingFactory();

// -------------------------------------------------
// Logic Binding
// =================================================
export class UILogicBindingFactory {
    register(selector: LogicBindingSelector, metadata: IAttributeBindingDefinition, Clazz?: ClassLike): void {
        registerLogicBindingMetadata(selector, metadata, Clazz);
    }
    has(selector: LogicBindingSelector): boolean {
        return hasLogicBindingMetadata(selector);
    }
}
export const logicBindingFactory = new UILogicBindingFactory();