import { INeElement, INeBindingScope, INeElementBinding, IBindingMetadata, EventName, INeBindingRef, IAttributeBindingMetadata, IBindingRefFactory, INeAttributeElement } from '../common/interfaces';
import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { cssProp2Prop, value2CssValue, parseToClassMap } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { isEmpty } from 'neurons-utils';
import { getUIBindingMetadata, createUIBindingInstance, getAttributeBindingMetadata, createAttributeBindingInstance } from '../factory/binding';
import { NeBindingRef } from '../refs/binding';
import { buildinBindingProviders, injectTempalateVaribles } from '../factory/injector';
import { IInjector } from 'neurons-injector';
import { INeElementChanges } from './element';
import { registerBindingElement, BindingElementTypes } from '../factory/element';

const noop = () => { };

export class NeAttributeElement implements INeAttributeElement {
    constructor(
        selector: string,
        bindingRefFactory: IBindingRefFactory,
    ) {
        this._selector = selector;
        // metadata
        this._metadata = getAttributeBindingMetadata(selector);
        // binding
        this._bindingRef = bindingRefFactory.newInstance();
        this.instance = this._bindingRef.instance();
        // 采集input output
        if (this._metadata) {
            this._inputProperties = this._metadata.properties || {};
            this._outputProperties = this._metadata.emitters || {};
        }
    }
    placeholder: any;
    instance: any;
    attached = false;

    protected inited = false;
    protected destroyed = false;

    private _selector: string;
    private _bindingRef: INeBindingRef;
    private _metadata: IAttributeBindingMetadata;
    private _inputProperties: { [aliasName: string]: string } = {};
    private _outputProperties: { [propertyName: string]: EventName } = {};

    private _hostStyles = {};
    private _hostClasses = {};
    private _hostAttributes = {};
    private _nativeEvents = [];

    private _fragment = nativeApi.createDocumentFragment();
    private _dirtyChanges: INeElementChanges = { attributes: {}, events: {}, inputs: {}, outputs: {}, twoWays: {}, attrs: {}, classes: {}, styles: {}, listeners: {} };
    detectChanges() {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            this._applyChanges();
        }
    }
    find(fn: (element: Node) => boolean): Node {
        return null;
    }
    attach(): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            if (!this.attached) {
                this.onAttach();
                this.attached = true;
            }
        }
    }
    detach(): void {
        if (!this.inited || this.destroyed) return;
        this.onDetach();
        this.attached = false;
    }
    resize() {
        if (!this.inited || this.destroyed) return;
        this.onResize();
    }
    appendChild<T extends Node>(newChild: T) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._fragment.appendChild(newChild);
        } else {
            this._bindingRef.appendChild(newChild);
        }
        return newChild;
    }
    insertTo(existNode: Node): void {
        if (this.destroyed) return;
        // if (!this.inited) {
        //     nativeApi.insertBefore(this.placeholder, existNode);
        // } else {
        //     this._bindingRef && this._bindingRef.insertTo(existNode);
        // }
    }
    setAttribute(property: string, value: string) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._dirtyChanges.attributes[property] = value;
        } else {
            if (this._isInputProperty(property)) {
                property = this._inputProperties[property] || property;
                this._dirtyChanges.inputs[property] = value;
            } else {
                this._dirtyChanges.attrs[property] = value;
            }
        }
    }
    setStyle(property: string, value: string) {
        if (this.destroyed) return;
        this._dirtyChanges.styles[property] = value;
    }
    addClass(className: string) {
        if (this.destroyed) return;
        this._dirtyChanges.classes[className] = true;
    }
    removeClass(className: string) {
        if (this.destroyed) return;
        this._dirtyChanges.classes[className] = false;
    }
    remove() {
        if (this.destroyed) return;
        this.detach();
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        if (!eventName || !handler || this.destroyed) return noop;
        let pendings;
        if (!this.inited) {
            if (!this._dirtyChanges.events[eventName]) {
                this._dirtyChanges.events[eventName] = [];
            }
            pendings = this._dirtyChanges.events[eventName];
        } else {
            if (eventName in this._outputProperties) {
                if (!this._dirtyChanges.outputs[eventName]) {
                    this._dirtyChanges.outputs[eventName] = [];
                }
                pendings = this._dirtyChanges.outputs[eventName];
            } else if (this._isTwoWayBinding(eventName)) {
                if (!this._dirtyChanges.twoWays[eventName]) {
                    this._dirtyChanges.twoWays[eventName] = [];
                }
                pendings = this._dirtyChanges.twoWays[eventName];
            } else {
                if (!this._dirtyChanges.listeners[eventName]) {
                    this._dirtyChanges.listeners[eventName] = [];
                }
                pendings = this._dirtyChanges.listeners[eventName];
            }
        }
        const pending = {
            remove: function () {
                const index = pendings.indexOf(pending);
                if (index !== -1) {
                    pendings.splice(index, 1);
                }
            },
            handler: handler,
        }
        pendings.push(pending);
        return () => pending.remove();
    }
    getBoundingClientRect(): ClientRect {
        if (this.destroyed || !this._bindingRef) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, };
        return this._bindingRef.getBoundingClientRect();
    }
    children(): HTMLElement[] {
        return this._bindingRef ? this._bindingRef.children() : [];
    }
    destroy() {
        if (this.destroyed) return;
        this.onDestroy();
        // nativeApi.remove(this.placeholder);
        this.destroyed = true;
    }
    protected initialize() {
        if (this.inited || this.attached || this.destroyed) return;
        if (!this._bindingRef) return;
        this.onInit();
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected onInit() {
        // 插入外部内容
        this._fragment.childNodes.length && this._bindingRef.appendChild(this._fragment);
        this._fragment = nativeApi.createDocumentFragment();
        // 插入文档
        // this._bindingRef.attachTo(this.placeholder);
        this._bindingRef.attach();
        // 应用变更
        this._applyChanges();
        // const firstChild = this._bindingRef.find(el => el instanceof Node);
        // firstChild && nativeApi.remove(this.placeholder);
    }
    protected onAttach() {
        this._bindingRef.attach();
        // const firstChild = this._bindingRef.find(el => el instanceof Node);
        // firstChild && nativeApi.remove(this.placeholder);
    }
    protected onDetach() {
        // const firstChild = this._bindingRef.find(el => el instanceof Node);
        // if (firstChild) {
        //     nativeApi.insertBefore(this.placeholder, firstChild);
        // }
        this._bindingRef.detach();
    }
    protected onResize() {
        this._bindingRef.resize();
    }
    protected onDestroy() {
        this._nativeEvents.forEach(fn => fn());
        this.instance && this.instance['__emitter'] && this.instance['__emitter'].off();
        this._bindingRef && this._bindingRef.destroy();
    }
    protected _setState(state: any) {
        this._bindingRef && this._bindingRef.setState(state);
    }
    protected _setAttribute(property: string, value: any) {
        this._bindingRef && this._bindingRef.setAttribute(property, value);
    }
    protected _setStyle(property: string, value: string) {
        this._bindingRef && this._bindingRef.setStyle(property, value);
    }
    protected _addClass(className: string) {
        this._bindingRef && this._bindingRef.addClass(className);
    }
    protected _removeClass(className: string) {
        this._bindingRef && this._bindingRef.removeClass(className);
    }
    protected _addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        return this._bindingRef ? this._bindingRef.addEventListener(eventName, handler) : noop;
    }
    private _applyChanges() {
        if (this.destroyed) return;
        const dirtyChanges = this._dirtyChanges;
        this._dirtyChanges = { attributes: {}, events: {}, inputs: {}, outputs: {}, twoWays: {}, attrs: {}, classes: {}, styles: {}, listeners: {} };
        if (!isEmpty(dirtyChanges.attributes)) {
            this._splitAttributess(dirtyChanges.attributes, dirtyChanges.inputs, dirtyChanges.attrs);
        }
        if (!isEmpty(dirtyChanges.events)) {
            this._splitEvents(dirtyChanges.events, dirtyChanges.outputs, dirtyChanges.twoWays, dirtyChanges.listeners);
        }
        // 先处理组件内部绑定，之后处理host绑定，保证外部能够覆盖内部绑定结果，事件监听亦然
        const inputs = dirtyChanges.inputs, outputs = dirtyChanges.outputs, twoWays = dirtyChanges.twoWays;
        const attrs = dirtyChanges.attrs, classes = dirtyChanges.classes, styles = dirtyChanges.styles, listeners = dirtyChanges.listeners;
        // 1. 监听事件，保证在setState之后事件监听能够收到反馈
        this._applyOutputEvents(outputs);
        this._applyTwoWayEvents(twoWays);
        this._applyHostEvents(listeners);

        // 2. 处理host dom变更
        Object.keys(attrs).forEach(property => {
            if (this._hostAttributes[property] !== attrs[property]) {
                this._hostAttributes[property] = attrs[property];
                this._setAttribute(property, attrs[property]);
            }
        });
        Object.keys(classes).forEach(className => {
            if (!!classes[className]) {
                if (this._hostClasses[className] !== true) {
                    this._hostClasses[className] = true;
                    this._addClass(className);
                }
            } else {
                if (className in this._hostClasses) {
                    delete this._hostClasses[className];
                    this._removeClass(className);
                }
            }
        });
        Object.keys(styles).forEach(styleName => {
            styleName = cssProp2Prop(styleName);
            const value = value2CssValue(styleName, styles[styleName]);
            if (this._hostStyles[styleName] !== value) {
                this._hostStyles[styleName] = value;
                this._setStyle(styleName, value);
            }
        });
        // 3. 处理状态变更
        !isEmpty(inputs) && this._setState(inputs);
    }
    private _splitAttributess(attributes, inputs, attrs) {
        Object.keys(attributes).forEach(property => {
            if (this._isInputProperty(property)) {
                property = this._inputProperties[property] || property;
                inputs[property] = attributes[property];
            } else {
                attrs[property] = attributes[property];
            }
        });
    }
    private _splitEvents(events, outputs, twoWays, listeners) {
        Object.keys(events).forEach(eventName => {
            if (eventName in this._outputProperties) {
                outputs[eventName] = events[eventName].concat(outputs[eventName] || []);
            } else if (this._isTwoWayBinding(eventName)) {
                twoWays[eventName] = events[eventName].concat(twoWays[eventName] || []);
            } else {
                listeners[eventName] = events[eventName].concat(listeners[eventName] || []);
            }
        });
    }
    private _applyOutputEvents(events: any): any {
        if (!events || isEmpty(events)) return null;
        Object.keys(events).forEach(key => {
            const pendings = events[key];
            if (pendings && this.instance[key]) {
                let eventName = key;
                if (typeof this.instance[key] === 'function' && this.instance['__emitter']) {
                    // 如果为函数绑定，则直接监听事件名称
                    eventName = this._outputProperties[key];
                    pendings.forEach(pending => {
                        pending.remove = this.instance['__emitter'].on(eventName, pending.handler);
                    });
                } else {
                    pendings.forEach(pending => {
                        pending.remove = (this.instance[key] as IEmitter<any>).listen(pending.handler);
                    });
                }
            }
        });
    }
    private _applyTwoWayEvents(events: any): any {
        if (!events || isEmpty(events)) return null;
        Object.keys(events).forEach(key => {
            const pendings = events[key];
            if (pendings) {
                const inputKey = this._inputProperties[key] || key;
                key = `${inputKey}Change`;
                if (this.instance[key] && typeof this.instance[key].listen === 'function' && typeof this.instance[key].emit === 'function') {
                    pendings.forEach(pending => {
                        pending.remove = (this.instance[key] as IEmitter<any>).listen(pending.handler);
                    });
                }
            }
        });
    }
    private _applyHostEvents(events): void {
        if (!events || isEmpty(events)) return null;
        Object.keys(events).forEach(eventName => {
            const pendings = events[eventName];
            pendings && pendings.forEach(pending => {
                const removeFn = this._addEventListener(eventName, pending.handler);
                const removeListening = () => {
                    removeFn();
                    const index = this._nativeEvents.indexOf(removeListening);
                    if (index !== -1) {
                        this._nativeEvents.splice(index, 1);
                    }
                };
                this._nativeEvents.push(removeListening);
                pending.remove = removeListening;
            });
        });
    }
    private _isTwoWayBinding(key) {
        if (!this._isInputProperty(key)) return false;
        const inputKey = this._inputProperties[key] || key;
        key = `${inputKey}Change`;
        if (this.instance[key] && typeof this.instance[key].listen === 'function' && typeof this.instance[key].emit === 'function') return true;
        return false;
    }
    private _isInputProperty(key) {
        if (!key) return false;
        if (key in this._inputProperties) return true;
        return false;
    }
}

registerBindingElement(BindingElementTypes.ATTRIBUTE, NeAttributeElement);