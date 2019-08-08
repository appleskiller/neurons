import { createElement, addClass, removeClass, removeMe, addEventListener, cssProp2Prop, value2CssValue, prop2CssProp, insertAfter, createDocumentFragment, nextChild, insertBefore, CSSStyleSheet } from '../../../utils/domutils';
import { isBrowser } from '../../../utils';
import { noop, ICustomElement } from './interfaces';

export type RemoveEventListenerFunction = () => void;

export const nativeApi = {
    createDocumentFragment: (): DocumentFragment => {
        return createDocumentFragment();
    },
    createElement: (tagName: string, className?: string, style?: CSSStyleSheet, xmlns?: string) => {
        return createElement(tagName, className, style, xmlns);
    },
    createComment: () => {
        return document.createComment('');
    },
    createTextNode: (text: string) => {
        return document.createTextNode(text);
    },
    nextChild: (existsDom: HTMLElement | Node) => {
        return nextChild(existsDom);
    },
    contains: (parent: HTMLElement | Node, existsDom: HTMLElement | Node): boolean => {
        return parent.contains(existsDom);
    },
    appendChild: (parent: HTMLElement | Node, child: HTMLElement | Element | Node) => {
        parent.appendChild(child);
    },
    insertBefore: (newDom: HTMLElement | Element | Node, existingDom: HTMLElement | Element | Node) => {
        insertBefore(newDom, existingDom);
    },
    insertAfter: (newDom: HTMLElement | Element | Node, existingDom: HTMLElement | Element | Node) => {
        insertAfter(newDom, existingDom);
    },
    getAttribute: <T>(element: HTMLElement | Element, property: string) => {
        return element.getAttribute(property);
    },
    setAttribute: (element: HTMLElement, property: string, value: string) => {
        element.setAttribute(property, value);
    },
    setStyle: (element: HTMLElement, property: string, value: string) => {
        const prop = cssProp2Prop(property);
        element.style[prop] = value2CssValue(prop, value);
    },
    addClass: (element: HTMLElement, className: string) => {
        addClass(element, className);
    },
    removeClass: (element: HTMLElement, className: string) => {
        removeClass(element, className);
    },
    remove: (element: HTMLElement | Node) => {
        removeMe(element);
    },
    addEventListener: (element, eventName: string, handler: any): RemoveEventListenerFunction => {
        return addEventListener(element, eventName, handler);
    },
    replaceData: (element: Text, offset: number, count: number, text: string) => {
        element.replaceData(offset, count, text);
    },
    onResize: (handler): RemoveEventListenerFunction => {
        if (!isBrowser) return noop;
        return addEventListener(window, 'resize', handler);
    },
    onHTMLScroll: (handler): RemoveEventListenerFunction => {
        if (!isBrowser) return noop;
        return addEventListener(window, 'scroll', handler);
    }
}

export const domapi = {
    setAttribute: <T>(element: ICustomElement<T> | HTMLElement, property: string, value: string) => {
        if (element instanceof Node) {
            nativeApi.setAttribute(element, property, value)
        } else {
            element.setAttribute(property, value);
        }
    },
    getAttribute: <T>(element: ICustomElement<T> | HTMLElement, property: string) => {
        if (element instanceof Node) {
            return nativeApi.getAttribute(element, property)
        } else {
            return element.getAttribute(property);
        }
    },
    setStyle: <T>(element: ICustomElement<T> | HTMLElement, property: string, value: string) => {
        if (element instanceof Node) {
            nativeApi.setStyle(element, property, value)
        } else {
            element.setStyle(property, value);
        }
    },
    addClass: <T>(element: ICustomElement<T> | HTMLElement, className: string) => {
        if (element instanceof Node) {
            nativeApi.addClass(element, className)
        } else {
            element.addClass(className);
        }
    },
    removeClass: <T>(element: ICustomElement<T> | HTMLElement, className: string) => {
        if (element instanceof Node) {
            nativeApi.removeClass(element, className)
        } else {
            element.removeClass(className);
        }
    },
    remove: <T>(element: ICustomElement<T> | HTMLElement) => {
        if (element instanceof Node) {
            nativeApi.remove(element)
        } else {
            element.remove();
        }
    },
    addEventListener: <T>(element: ICustomElement<T> | HTMLElement, eventName: string, handler: any): RemoveEventListenerFunction => {
        if (element instanceof Node) {
            return nativeApi.addEventListener(element, eventName, handler);
        } else {
            return element.addEventListener(eventName, handler);
        }
    },
}