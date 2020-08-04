import { IBindingDefinition, BindingSelector, BindingTemplate, IUIStateStatic, IUIState, IBindingRef, IElementOptions } from './common/interfaces';
import { bindingFactory } from './factory/factory';
import { isBrowser } from 'neurons-utils';
import { nativeApi } from './common/domapi';
import { Provider, IInjector, ClassLike } from 'neurons-injector';
import "./elements";
import { IHTMLASTRoot, parseHTML } from './compiler/parser/template';

export { BINDING_TOKENS } from './factory/injector';
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

export function bootstrap<T extends IUIState>(selector: string): IBindingRef<T> {
    if (!selector) return;
    if (isBrowser) {
        const element = window.document.body.querySelector(selector);
        if (!element) return;
        const template = element.outerHTML;
        const placeholder = nativeApi.createComment();
        nativeApi.insertBefore(placeholder, element);
        nativeApi.remove(element);
        return bind(template, { placeholder: placeholder });
    } else {
        // TODO
    }
}
