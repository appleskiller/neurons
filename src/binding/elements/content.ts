import { INeElement, INeBindingScope, INeElementBinding, noop } from '../common/interfaces';
import { nativeApi, RemoveEventListenerFunction } from '../common/domapi';
import { registerBindingElement, BindingElementTypes } from '../factory/element';

export class NeContentElement implements INeElement {
    placeholder: Node = nativeApi.createComment();
    attached = false;
    protected inited = false;
    protected destroyed = false;
    private _fragment = nativeApi.createDocumentFragment();
    private _children = [];

    getTemplateVarible(id: string): HTMLElement | Node | INeElement {
        return null;
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
    resize() {}
    appendChild<T extends Node>(newChild: T) {
        if (this.destroyed) return;
        if (!this.inited) {
            this._fragment.appendChild(newChild);
        } else {
            // TODO
        }
        this._children.push(newChild);
        return newChild;
    }
    insertTo(existNode: Node): void {
        if (this.destroyed) return;
        nativeApi.insertBefore(this.placeholder, existNode);
        // TODO
        // if (!this.inited) {
        // } else {
        // }
    }
    setAttribute(property: string, value: string) {}
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
    children(): HTMLElement[] {
        // TODO
        return [];
    }
    getBoundingClientRect(): ClientRect {
        return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, };
    }
    destroy() {
        if (this.destroyed) return;
        this.onDestroy();
        nativeApi.remove(this.placeholder);
        this.destroyed = true;
    }
    detectChanges(recursive: boolean = false) {}
    find(fn: (element: Node) => boolean): Node {
        return null;
    }
    protected initialize() {
        if (this.inited || this.attached || this.destroyed) return;
        if (!this.placeholder.parentNode) return;
        this.onInit();
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected onInit() {
        nativeApi.insertBefore(this._fragment, this.placeholder);
        // nativeApi.insertAfter(this._fragment, this.placeholder);
        this._fragment = nativeApi.createDocumentFragment();
        nativeApi.remove(this.placeholder);
        // TODO
    }
    protected onAttach() {
        // TODO
    }
    protected onDetach() {
        // TODO
    }
    protected onResize() {
        // TODO
    }
    protected onDestroy() {
        // TODO
    }
}

registerBindingElement(BindingElementTypes.CONTENT, NeContentElement);