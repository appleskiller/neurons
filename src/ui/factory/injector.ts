import { Injector, Provider } from '../../helper/injector';
import { IChangeDetector, ICustomElement } from '../compiler/common/interfaces';
import { wrappCustomeElement } from '../compiler/refs/element';

export const BINDING_TOKENS = {
    ELEMENTS: 'ELEMENTS',
    CHANGE_DETECTOR: 'CHANGE_DETECTOR',
}

export function buildinBindingProviders(bindingRef): Provider[] {
    return [{
        token: BINDING_TOKENS.ELEMENTS,
        useFactory: () => bindingRef.elements()
    }, {
        token: BINDING_TOKENS.CHANGE_DETECTOR,
        use: <IChangeDetector>{
            detectChanges: () => bindingRef.detectChanges()
        }
    }];
}

export function attachTempalateElementProperty(instance, bindingRef): void {
    if (!instance || !bindingRef) return;
    const templateElementRequired = instance.templateElementRequired;
    delete instance.templateElementRequired;
    if (templateElementRequired) {
        Object.keys(templateElementRequired).forEach(property => {
            const id = templateElementRequired[property];
            const varible: HTMLElement | Node | ICustomElement<any> = bindingRef.getTemplateVarible(id);
            if (!varible || 'nodeType' in varible) {
                instance[property] = varible;
            } else {
                instance[property] = wrappCustomeElement(varible);
            }
        })
    }
}

export const bindingInjector = new Injector();