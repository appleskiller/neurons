import { IInjector } from "neurons-injector";
import { bind } from "../../binding";
import { IBindingRef } from "../../binding/common/interfaces";
import { IJSEFormControl, IJSENode } from "./interfaces";
import { UnknownRenderer } from "./renderers/unknown";


export class JSERendererFactory {
    constructor(protected renderers: {[renderer: string]: any}) {}

    reset(renderers: {[renderer: string]: any}) {
        this.renderers = renderers;
    }

    getRendererType(node: IJSENode) {
        return this._getRendererType(node);
    }
    getRenderer(node: IJSENode): any {
        const renderer = this._getRendererType(node);
        return this.renderers[renderer] || UnknownRenderer;
    }
    getInstance(node: IJSENode, container: HTMLElement, formControl: IJSEFormControl, injector: IInjector, extraHostBinding?: {[key: string]: string}, extraState?: any): IBindingRef<any> {
        const rendererClass = this.getRenderer(node);
        const hostBinding = {
            '[node]': 'node',
            '[formControl]': 'formControl',
            ...(extraHostBinding || {})
        };
        const state = {
            node: node,
            formControl: formControl,
            ...(extraState || {})
        };
        return bind(rendererClass, {
            container: container,
            parentInjector: injector,
            hostBinding: hostBinding,
            state: state
        });
    }
    private _getRendererType(node: IJSENode) {
        if (!node || !node.schema) return '';
        const renderer = (node.schema.renderer || node.schema.type || 'unknown').toLowerCase();
        return this.renderers[renderer] ? renderer : 'unknown';
    }
}

