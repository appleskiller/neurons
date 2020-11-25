
import { INeElement, INeBindingScope, INeElementBinding, IBindingMetadata, EventName, INeBindingRef, noop, BindingSelector, BindingTemplate, IUIStateStatic, IBindingDefinition } from '../common/interfaces';
import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { cssProp2Prop, value2CssValue, parseToClassMap } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { isEmpty } from 'neurons-utils';
import { getUIBindingMetadata, hasUIBindingMetadata, findUIBindingMetadata } from '../factory/binding';
import { NeBindingRef } from '../refs/binding';
import { buildinBindingProviders } from '../factory/injector';
import { IInjector, Provider } from 'neurons-injector';
import { INeElementChanges } from './element';
import { bindSource } from '../compiler';
import { registerBindingElement, BindingElementTypes } from '../factory/element';

export class NeDynamicElement implements INeElement {
    constructor(
        parent?: INeBindingRef,
        parentInjector?: IInjector,
    ) {
        this._parentInjector = parentInjector;
        this._parent = parent;
    }

    placeholder: Node = nativeApi.createComment();
    instance: any;
    attached = false;

    protected inited = false;
    protected destroyed = false;

    private _bindingRef: INeBindingRef;
    private _parentInjector: IInjector;
    private _parent: INeBindingRef;
    private _inputProperties: { [aliasName: string]: string } = {
        'source': 'source',
        'hostBinding': 'hostBinding',
        'state': 'state',
        'providers': 'providers',
    };
    private _source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<any>;
    private _hostBinding: IBindingDefinition;
    private _state: any;
    private _providers: Provider[];

    private _fragment = nativeApi.createDocumentFragment();
    private _dirtyChanges = {}
    detectChanges(recursive: boolean = false) {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            this._applyChanges(recursive);
        }
    }
    find(fn: (element: Node) => boolean): Node {
        if (!this.inited || !this._bindingRef) return fn(this.placeholder) ? this.placeholder : null;
        const result = this._bindingRef.find(fn);
        return result ? result : (this.attached && fn(this.placeholder) ? this.placeholder : null);
    }
    attach(): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            if (this.placeholder.parentNode && !this.attached) {
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
            this._bindingRef && this._bindingRef.appendChild(newChild);
        }
        return newChild;
    }
    insertTo(existNode: Node): void {
        if (this.destroyed) return;
        if (!this.inited) {
            nativeApi.insertBefore(this.placeholder, existNode);
        } else {
            this._bindingRef && this._bindingRef.insertTo(existNode);
        }
    }
    setAttribute(property: string, value: any) {
        if (this.destroyed) return;
        if (!this._isInputProperty(property)) return;
        property = this._inputProperties[property] || property;
        this._dirtyChanges[property] = value;
    }
    setStyle(property: string, value: string) {}
    addClass(className: string) {}
    removeClass(className: string) {}
    remove() {
        if (this.destroyed) return;
        this.detach();
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        return noop;
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
        nativeApi.remove(this.placeholder);
        this.destroyed = true;
    }
    protected initialize() {
        if (this.inited || this.attached || this.destroyed) return;
        if (!this.placeholder.parentNode || !this._dirtyChanges['source']) return;
        this.onInit();
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected onInit() {
        // 应用变更
        this._applyChanges();
        // 插入外部内容
        this._fragment.childNodes.length && this._bindingRef.appendChild(this._fragment);
        this._fragment = nativeApi.createDocumentFragment();
        // 插入文档
        this._bindingRef.attachTo(this.placeholder);
        // 移除占位
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        firstChild && nativeApi.remove(this.placeholder);
    }
    protected onAttach() {
        if (!this._bindingRef) return;
        this._bindingRef.attach();
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        firstChild && nativeApi.remove(this.placeholder);
    }
    protected onDetach() {
        if (!this._bindingRef) return;
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        if (firstChild) {
            nativeApi.insertBefore(this.placeholder, firstChild);
        }
        this._bindingRef.detach();
    }
    protected onResize() {
        this._bindingRef && this._bindingRef.resize();
    }
    protected onDestroy() {
        this._bindingRef && this._bindingRef.destroy();
    }
    private _applyChanges(recursive: boolean = false) {
        if (this.destroyed || isEmpty(this._dirtyChanges)) return;
        const dirtyChanges = this._dirtyChanges;
        this._dirtyChanges = {};
        let changed = false, rebind = false;
        if ('source' in dirtyChanges && this._source !== dirtyChanges['source']) {
            this._source = dirtyChanges['source'];
            rebind = true;
        }
        if ('hostBinding' in dirtyChanges && this._hostBinding !== dirtyChanges['hostBinding']) {
            this._hostBinding = dirtyChanges['hostBinding'];
            rebind = true;
        }
        if ('providers' in dirtyChanges && this._providers !== dirtyChanges['providers']) {
            this._providers = dirtyChanges['providers'];
            rebind = true;
        }
        if ('state' in dirtyChanges && this._state !== dirtyChanges['state']) {
            this._state = dirtyChanges['state'];
            if (this._bindingRef) {
                changed = true;
            } else {
                rebind = true;
            }
        }
        if (rebind) {
            this._rebinding();
        } else if (changed) {
            this._bindingRef && this._bindingRef.setState(this._state, recursive);
        } else if (recursive) {
            this._bindingRef && this._bindingRef.detectChanges(recursive);
        }
    }
    private _destroyBinding() {
        if (this._bindingRef) {
            if (this.attached) {
                const firstChild = this._bindingRef.find(el => el instanceof Node);
                if (firstChild) {
                    nativeApi.insertBefore(this.placeholder, firstChild);
                }
            }
            this._bindingRef.destroy();
            this._bindingRef = null;
        }
    }
    private _rebinding() {
        this._destroyBinding();
        if (!this._source) return;
        this._bindingRef = bindSource(this._source, this._hostBinding, this._providers, this._parent, this._parentInjector);
        this._bindingRef.bind(this._state);
        // 插入文档
        this._bindingRef.attachTo(this.placeholder);
        // 移除占位
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        firstChild && nativeApi.remove(this.placeholder);
    }
    private _isInputProperty(key) {
        if (!key) return false;
        if (key in this._inputProperties) return true;
        return false;
    }
}

registerBindingElement(BindingElementTypes.DYNAMIC, NeDynamicElement);