import { IBindingDefinition, BindingSelector, BindingTemplate, IUIStateStatic, IUIState, IBindingRef, IElementOptions, IBootstrapOptions, IUIBindingDefinition } from './common/interfaces';
import { bindingFactory } from './factory/factory';
import { isBrowser, uniqueId } from 'neurons-utils';
import { nativeApi } from './common/domapi';
import { Provider, IInjector, ClassLike } from 'neurons-injector';
import "./elements";
import { IHTMLASTRoot, parseHTML } from './compiler/parser/template';
import { internalThemeManager } from '../cdk/theme/manager';

export { BINDING_TOKENS, bindingInjector } from './factory/injector';
export { Element, Property, Binding, Inject, Emitter, Style } from './factory/decorator';

export function parseTemplate(template: string): IHTMLASTRoot {
    return parseHTML(template);
}

export function bind<T extends IUIState>(
    source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>,
    option?: IElementOptions<T>
): IBindingRef<T> {
    option = option || {};
    const elementRef = bindingFactory.create<T>(source, option.state, option.hostBinding, option.providers, null, option.parentInjector, option.skipError);
    if (option.placeholder) {
        elementRef.attachTo(option.placeholder);
    } else {
        option.container && elementRef.appendTo(option.container);
    }
    return elementRef;
}

export function bootstrap(
    source: BindingSelector,
    option?: IBootstrapOptions
): IBindingRef<any> {
    if (!source) return;
    if (isBrowser) {
        const element = window.document.body.querySelector(source);
        if (!element) return;
        const template = element.outerHTML;
        const placeholder = nativeApi.createComment();
        nativeApi.insertBefore(placeholder, element);
        nativeApi.remove(element);
        return bind(template, {
            ...(option || {}),
            placeholder: placeholder
        });
    } else {
        // TODO
    }
}

// For Javascript
export function NeComponent(definition: IUIBindingDefinition, clazz: ClassLike) {
    bindingFactory.register(definition.selector, definition, clazz);
    // 插入组件样式
    if (definition && definition.style) {
        const id = uniqueId('ne_ui_style');
        internalThemeManager.addStyles(id, definition.style);
    }
}
