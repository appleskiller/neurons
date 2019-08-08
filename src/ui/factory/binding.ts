
import { isBrowser } from '../../utils';
import { nativeApi } from '../compiler/common/domapi';
import { IBindingDefinition, IElementRef, IUIStateStatic, StateObject, UIBindingSelector, UIBindingTemplate } from '../compiler/common/interfaces';
import { bindingFactory } from '../factory/factory';


export interface IElementOptions<T extends StateObject> {
    container?: HTMLElement;
    placeholder?: Node;
    hostBinding?: IBindingDefinition;
    state?: any;
}

export function bind<T extends StateObject>(
    source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>,
    option?: IElementOptions<T>
): IElementRef<T> {
    option = option || {};
    const elementRef = bindingFactory.create<T>(source, option.state, option.hostBinding);
    if (option.placeholder) {
        elementRef.attachTo(option.placeholder);
    } else {
        option.container && elementRef.appendTo(option.container);
    }
    return elementRef;
}

export function bootstrap<T extends StateObject>(selector: string): IElementRef<T> {
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