import { Injector, Provider } from 'neurons-injector';
import { IChangeDetector, INeElement, INeBindingRef } from '../common/interfaces';
import { wrapElement2ElementRef, wrapBindingRef2ElementRef } from '../refs/element';
import { isArray } from 'neurons-utils';

export const BINDING_TOKENS = {
    ELEMENT_REF: 'ELEMENT_REF',
    CHANGE_DETECTOR: 'CHANGE_DETECTOR',
}

export function buildinBindingProviders(bindingRef: INeBindingRef): Provider[] {
    return [
    {
        token: BINDING_TOKENS.ELEMENT_REF,
        useFactory: () => wrapBindingRef2ElementRef(bindingRef)
    }, {
        token: BINDING_TOKENS.CHANGE_DETECTOR,
        use: <IChangeDetector>{
            detectChanges: (recursive: boolean = false) => bindingRef.detectChanges(recursive)
        }
    }];
}

export function injectTempalateVaribles(instance, bindingRef: INeBindingRef): void {
    if (!instance || !bindingRef) return;
    const templateElementRequired = instance.templateElementRequired;
    delete instance.templateElementRequired;
    if (templateElementRequired) {
        Object.keys(templateElementRequired).forEach(property => {
            let varible: HTMLElement | Node | INeElement | (HTMLElement | Node | INeElement)[];
            const id = templateElementRequired[property];
            if (id) {
                varible = bindingRef.getTemplateVarible(id);
            } else {
                const elements = bindingRef.elements();
                if (elements.length === 1) {
                    varible = elements[0];
                } else {
                    varible = elements;
                }
            }
            if (!varible || varible instanceof Node) {
                instance[property] = varible;
            } else {
                if (isArray(varible)) {
                    instance[property] = (varible as any[]).map(v => {
                        if (v instanceof Node) {
                            return v;
                        } else {
                            return wrapElement2ElementRef(v);
                        }
                    });
                } else {
                    instance[property] = wrapElement2ElementRef(varible as any);
                }
            }
        })
    }
}

export const bindingInjector = new Injector();