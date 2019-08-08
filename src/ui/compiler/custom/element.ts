import { nativeApi, RemoveEventListenerFunction } from '../common/domapi';
import { IBindingScope, IElementData, ICustomElement } from '../common/interfaces';

export interface ICustomElementContext {

}

export interface IBeforeInitChanges<T> {
    attributes: any;
    classes: string | any;
    styles: string | any;
    events: any;
    fragment: DocumentFragment;
}

const noop = () => {};

export class CustomElement<T> implements ICustomElement<T> {
    constructor() {}

    placeholder: Node = nativeApi.createComment();

    protected inited = false;
    protected destroyed = false;
    protected attached = false;

    protected data: IElementData<T>;

    private _beforeInitChanges: IBeforeInitChanges<T> = { attributes: {}, classes: {}, styles: {}, events: {}, fragment: nativeApi.createDocumentFragment() }

    bind(data: IElementData<T>): void {
        if (this.destroyed) return;
        this.data = data;
        if (!this.inited) {
            this._initialize();
        } else {
            this._update();
        }
    }
    firstChild(): Node {
        return this.placeholder;
    }
    forEach(fn: (item: HTMLElement) => void): void {

    }
    detectChanges() {
        // 子类覆盖
    }
    hasAttached(): boolean {
        return this.attached;
    }
    attach(): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this._initialize();
        } else {
            if (this.placeholder.parentNode && !this.attached) {
                this._onAttach();
                this.attached = true;
            }
        }
    }
    detach(): void {
        if (!this.inited || this.destroyed) return;
        this._onDetach();
        this.attached = false;
    }
    resize(): void {
        if (!this.inited || this.destroyed) return;
        this._onResize();
    }
    appendChild(child: HTMLElement | Node): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this._beforeInitChanges.fragment.appendChild(child);
        } else {
            if (!this.attached) {
                // 如果在detach之后append，将认为操作无效
                return;
            }
            this._onAppendChild(child);
        }
    }
    getAttribute(property: string): any {
        if (this.destroyed) return null;
        if (!this.inited) {
            return this._beforeInitChanges.attributes[property];
        } else {
            return this._onGetAttribute(property);
        }
    }
    setAttribute(property: string, value: string) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._beforeInitChanges.attributes[property] = value;
        } else {
            this._onSetAttribute(property, value);
        }
    }
    setStyle(property: string, value: string) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._beforeInitChanges.styles[property] = value;
        } else {
            this._onSetStyle(property, value);
        }
    }
    addClass(className: string) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._beforeInitChanges.classes[className] = true;
        } else {
            this._onAddClass(className);
        }
    }
    removeClass(className: string) {
        if (this.destroyed) return;
        if (!this.inited) {
            delete this._beforeInitChanges.classes[className];
        } else {
            this._onRemoveClass(className);
        }
    }
    remove() {
        if (this.destroyed) return;
        this.detach();
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        if (!eventName || !handler || this.destroyed) return noop;
        if (!this.inited) {
            if (!this._beforeInitChanges.events[eventName]) {
                this._beforeInitChanges.events[eventName] = [];
            }
            const pendings = this._beforeInitChanges.events[eventName];
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
        } else {
            return this._onAddEventListener(eventName, handler);
        }
    }
    destroy() {
        if (this.destroyed) return;
        this._onDestroy();
        nativeApi.remove(this.placeholder);
        this.destroyed = true;
    }
    protected _onAppendChild(child: HTMLElement | Node): void {
        // 子类覆盖
    }
    protected _onGetAttribute(property: string) {
        // 子类覆盖
    }
    protected _onSetAttribute(property: string, value: string) {
        // 子类覆盖
    }
    protected _onSetStyle(property: string, value: string) {
        // 子类覆盖
    }
    protected _onAddClass(className: string) {
        // 子类覆盖
    }
    protected _onRemoveClass(className: string) {
        // 子类覆盖
    }
    protected _onAddEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        // 子类覆盖
        return noop;
    }
    protected _onInit(initChanges: IBeforeInitChanges<T>) {
        // 子类覆盖
    }
    protected _onUpdate() {
        // 子类覆盖
    }
    protected _onAttach() {
        // 子类覆盖
    }
    protected _onDetach() {
        // 子类覆盖
    }
    protected _onResize() {
        // 子类覆盖
    }
    protected _onDestroy() {
        // 子类覆盖
    }
    protected _initialize() {
        if (this.inited || this.attached || this.destroyed) return;
        if (!this.placeholder.parentNode || !this.data) return;
        this._onInit(this._beforeInitChanges);
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected _update() {
        if (!this.inited || this.destroyed) return;
        this._onUpdate();
    }
}