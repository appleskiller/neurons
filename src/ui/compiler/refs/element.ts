import { IBindingRef, IElementRef, StateObject, ICustomElement, IElement } from '../common/interfaces';

export function createElementRef<T extends StateObject>(
    bindingRef: IBindingRef<T>,
    state?: T
): IElementRef<T> {
    let instance = state;
    const ref =  {
        setState: function(state: T) {
            bindingRef.bind({context: state});
            return this;
        },
        getState: function() {
            return instance;
        },
        children: function () {
            return bindingRef.children();
        },
        appendTo: function(parent: Node) {
            bindingRef.appendTo(parent);
            return this;
        },
        attachTo: function(placeholder: Node) {
            bindingRef.attachTo(placeholder);
            return this;
        },
        hasAttached: function() {
            return bindingRef.attached;
        },
        attach: function() {
            bindingRef.attach();
            return this;
        },
        detach: function() {
            bindingRef.detach();
            return this;
        },
        resize: function() {
            bindingRef.resize();
            return this;
        },
        detectChanges: function() {
            bindingRef.detectChanges();
            return this;
        },
        destroy: function() {
            instance && instance['__emitter'] && instance['__emitter'].off();
            bindingRef.destroy();
        },

        getBoundingClientRect(): ClientRect {
            return bindingRef.getBoundingClientRect();
        }
    }
    instance && ref.setState(instance);
    return ref;
}

export function wrappCustomeElement(customElement: ICustomElement<any>): IElement {
    const element: IElement = {
        hasAttached: function () {
            return customElement.hasAttached();
        },
        attach: function () {
            customElement.attach();
            return this;
        },
        detach: function () {
            customElement.detach();
            return this;
        },
        resize: function () {
            customElement.resize();
            return this;
        },
        detectChanges: function () {
            customElement.detectChanges();
            return this;
        }
    }
    return element;
}