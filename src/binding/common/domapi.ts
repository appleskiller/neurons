import { createElement, addClass, removeClass, removeMe, addEventListener, cssProp2Prop, value2CssValue, prop2CssProp, insertAfter, createDocumentFragment, nextChild, insertBefore } from 'neurons-dom';
import { isBrowser } from 'neurons-utils';
import { noop, INeElement } from './interfaces';

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
    getAttribute: (element: HTMLElement | Element, property: string) => {
        return element.getAttribute(property);
    },
    setAttribute: (element: HTMLElement, property: string, value: string) => {
        if (value === undefined || value === null) {
            element.removeAttribute(property);
        } else {
            element.setAttribute(property, value);
        }
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
    setAttributes: (element: INeElement | HTMLElement, attrs: {[key: string]: string}) => {
        Object.keys(attrs || {}).forEach(property => {
            if (element instanceof Node) {
                if (attrs[property] === undefined || attrs[property] === null) {
                    element.removeAttribute(property);
                } else {
                    element.setAttribute(property, attrs[property]);
                }
            } else {
                element.setAttribute(property, attrs[property])
            }
        });
    },
    setAttribute: (element: INeElement | HTMLElement, property: string, value: any) => {
        if (element instanceof Node) {
            if (value === undefined || value === null) {
                element.removeAttribute(property);
            } else {
                element.setAttribute(property, value);
            }
        } else {
            element.setAttribute(property, value)
        }
    },
    setClasses: (element: INeElement | HTMLElement, classes: { [key: string]: boolean }) => {
        classes = classes || {};
        if (element instanceof Node) {
            Object.keys(classes).forEach(className => classes[className] ? addClass(element, className) : removeClass(element, className));
        } else {
            Object.keys(classes).forEach(className => classes[className] ? element.addClass(className) : element.removeClass(className));
        }
    },
    setStyles: (element: INeElement | HTMLElement, styles: { [key: string]: string }) => {
        styles = styles || {};
        if (element instanceof Node) {
            Object.keys(styles).forEach(styleName => {
                const prop = cssProp2Prop(styleName);
                element.style[prop] = value2CssValue(prop, styles[styleName]);
            });
        } else {
            Object.keys(styles).forEach(styleName => element.setStyle(styleName, styles[styleName]));
        }
    },
    setStyle: (element: INeElement | HTMLElement, property: string, value: string) => {
        if (element instanceof Node) {
            const prop = cssProp2Prop(property);
            element.style[prop] = value2CssValue(prop, value);
        } else {
            element.setStyle(property, value);
        }
    },
    addClass: (element: INeElement | HTMLElement, className: string) => {
        if (element instanceof Node) {
            addClass(element, className)
        } else {
            element.addClass(className);
        }
    },
    removeClass: (element: INeElement | HTMLElement, className: string) => {
        if (element instanceof Node) {
            removeClass(element, className)
        } else {
            element.removeClass(className);
        }
    },
    remove: (element: INeElement | HTMLElement) => {
        if (element instanceof Node) {
            removeMe(element)
        } else {
            element.remove();
        }
    },
    addEventListener: (element: INeElement | HTMLElement, eventName: string, handler: any): RemoveEventListenerFunction => {
        if (element instanceof Node) {
            return addEventListener(element, eventName, handler);
        } else {
            return element.addEventListener(eventName, handler);
        }
    },
}