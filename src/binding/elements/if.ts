import { INeElement, INeBindingScope, INeElementBinding, IBindingMetadata, EventName, INeBindingRef, ILogicBindingMetadata, IBindingRefFactory, noop, INeBindingFunction, INeLogicElement } from '../common/interfaces';
import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { cssProp2Prop, value2CssValue, parseToClassMap } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { isEmpty, geometry } from 'neurons-utils';
import { getUIBindingMetadata, getLogicBindingMetadata } from '../factory/binding';
import { NeBindingRef } from '../refs/binding';
import { buildinBindingProviders } from '../factory/injector';
import { IInjector } from 'neurons-injector';
import { INeElementChanges } from './element';
import { IStatementInfo } from '../compiler/parser/statement';
import { BuildInsVaribles } from '../common/enums';
import { GeometryRect } from 'neurons-utils/utils/geometryutils';
import { registerBindingElement, BindingElementTypes } from '../factory/element';

export class NeIfElement implements INeLogicElement {
    constructor(
        logicSelector: string,
        // *xxx="statement"
        logicValue: IStatementInfo,
        // binding ref
        bindingRefFactory: IBindingRefFactory
    ) {
        this._bindingRefFactory = bindingRefFactory;
    }

    placeholder: Node = nativeApi.createComment();
    attached = false;

    protected inited = false;
    protected destroyed = false;

    private _actived = false;
    private _activeChanged = false;
    
    private _fragment = nativeApi.createDocumentFragment();
    private _bindingRefFactory: IBindingRefFactory;

    private _context: any;
    private _implicits: any[] = [];
    private _bindingRef: INeBindingRef;
    bind(context: any, implicits?: any[]): void {
        this._context = context;
        this._implicits = implicits;
    }
    implicits(datas: any[]): void {
        this._implicits = datas;
    }
    detectChanges(recursive: boolean = false) {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            this._applyChanges(recursive);
        }
    }
    find(fn: (element: Node) => boolean): Node {
        if (!this.inited) return fn(this.placeholder) ? this.placeholder : null;
        const result = this._bindingRef ? this._bindingRef.find(fn) : null;
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
    passOnAttach(): void {
        if (this.destroyed) return;
        this._bindingRef && this._bindingRef.passOnAttach();
    }
    passOnDetach(): void {
        if (this.destroyed) return;
        this._bindingRef && this._bindingRef.passOnDetach();
    }
    resize() {
        if (!this.inited || this.destroyed) return;
        if (this.attached) {
            this.onResize();
        }
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
        if (property === '*if') {
            if (this._actived !== !!value) {
                this._actived = !!value;
                this._activeChanged = true;
            }
        }
    }
    setStyle(property: string, value: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.styles[property] = value;
    }
    addClass(className: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.classes[className] = true;
    }
    removeClass(className: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.classes[className] = false;
    }
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
        if (!this.placeholder.parentNode || !this._actived) return;
        this.onInit();
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected onInit() {
        // 构造bindingRef
        this._bindingRef = this._bindingRefFactory.newInstance();
        this._bindingRef.bind(this._context, this._implicits);
        // 插入外部内容
        this._fragment.childNodes.length && this._bindingRef.appendChild(this._fragment);
        this._fragment = nativeApi.createDocumentFragment();
        // 插入文档
        this._bindingRef.attachTo(this.placeholder);
        // 应用变更
        this._activeChanged = true;
        this._applyChanges();
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        firstChild && nativeApi.remove(this.placeholder);
    }
    protected onAttach() {
        this._bindingRef.attach();
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        firstChild && nativeApi.remove(this.placeholder);
    }
    protected onDetach() {
        const firstChild = this._bindingRef.find(el => el instanceof Node);
        if (firstChild) {
            nativeApi.insertBefore(this.placeholder, firstChild);
        }
        this._bindingRef.detach();
    }
    protected onResize() {
        this._bindingRef.resize();
    }
    protected onDestroy() {
        this._bindingRef && this._bindingRef.destroy();
    }
    private _applyChanges(recursive: boolean = false) {
        if (this.destroyed) return;
        if (this._activeChanged) {
            this._activeChanged = false;
            if (this._actived) {
                this.onAttach();
            } else {
                this.onDetach();
            }
        }
        if (this._actived) {
            this._bindingRef.implicits(this._implicits || []);
            this._bindingRef.detectChanges(recursive);
        }
    }
}

registerBindingElement(BindingElementTypes.IF, NeIfElement);