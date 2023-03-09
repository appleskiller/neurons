
import { IEmitter } from "neurons-emitter";
import { IInjector } from "neurons-injector";
import { isEmpty } from "neurons-utils";
import { IBindingRef } from "../../binding/common/interfaces";
import { bind, Binding, BINDING_TOKENS, Element, Emitter, Inject, Property } from "../../binding";
import { theme } from "../style/theme";
import { JSEFormControl } from "./formcontrol";
import { IJSEDataControl, IJSEFormControl, IJSENode, IJSERoot, IJSONSchema, IPropertiesSchema } from "./interfaces";
import { renderers } from "./renderers/renderers";
import { JSERendererFactory } from "./factory";
import { createJSERoot } from "./jsenodeutil";

@Binding({
    selector: 'ui-json-editor',
    template: `
        <div class="ui-json-editor" jse-renderer="SCHEMA" #container></div>
    `,
    style: `
        .ui-json-editor {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: auto;
            .ui-jse-renderer {
                position: relative;
                user-select: none;
                transition: ${theme.transition.normal('background-color')};
                &:hover {
                    background-color: ${theme.gray.light};
                }
                & > .ui-jse-renderer-title {
                    position: absolute;
                    left: 24px;
                    top: 10px;
                    width: 110px;
                    line-height: 21px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & > .ui-jse-renderer-content {
                    position: relative;
                    padding: 4px 24px 4px 128px;
                    min-height: 31px;
                }
                &[no-title] {
                    & > .ui-jse-renderer-title {
                        display: none;
                    }
                    & > .ui-jse-renderer-content {
                        padding: 4px 24px 4px 24px;
                    }
                }
            }
        }
        .ui-jse-array-item {
            &.ne-dragging {
                display: none;
            }
            &[drop-touching-position=intersected] {
                border: dashed 1px ${theme.gray.heavy};
                .ui-jse-array-item-dragdrop-marker {
                    display: block;
                }
            }
        }
        .draggable-wrapper[drag-scope=ui-jse-array-item] {
            pointer-events: none;
            border-radius: 3px;
            overflow: hidden;
            box-sizing: border-box;
            opacity: 0.3;
            box-shadow: 2px 2px 8px ${theme.black.light};
            transition: ${theme.transition.normal('background-color', 'box-shadow')};
            .ui-jse-renderer {
                position: relative;
                user-select: none;
                transition: ${theme.transition.normal('background-color')};
                &:hover {
                    background-color: ${theme.gray.light};
                }
                & > .ui-jse-renderer-title {
                    position: absolute;
                    left: 24px;
                    top: 10px;
                    width: 110px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & > .ui-jse-renderer-content {
                    position: relative;
                    padding: 4px 24px 4px 128px;
                }
                &[no-title] {
                    & > .ui-jse-renderer-title {
                        display: none;
                    }
                    & > .ui-jse-renderer-content {
                        padding: 4px 24px 4px 24px;
                    }
                }
            }
            &[drop-touching-position=outside] {
                background-color: rgba(244, 67, 54, 0.75);
            }
        }
        .droppable-placeholder[drag-scope=ui-jse-array-item] {
            background-color: ${theme.gray.normal};
            border-radius: 3px;
            .ui-jse-array-item {
                border: dashed 1px ${theme.gray.heavy};
            }
            &[drop-touching-position=intersected] {
                .ui-jse-array-item-dragdrop-marker {
                    display: block;
                }
            }
        }
    `,
    requirements: [
    ]
})
export class JsonEditor {

    @Property() object: any;
    @Property() schema: IJSONSchema;
    @Property() attributes: any;
    @Property() extraRenderers: any;
    @Property() dataControl: IJSEDataControl;

    @Property() indentSize: number = 24;

    @Element('container') container: HTMLElement;

    @Emitter() dataChange: IEmitter<any>;
    @Emitter() dataRefresh: IEmitter<any>;

    @Inject(BINDING_TOKENS.INJECTOR) injector: IInjector;

    protected refs: {renderer: string, ref: IBindingRef<any>}[] = [];
    protected formControl: IJSEFormControl;
    protected rendererFactory: JSERendererFactory;
    protected root: IJSERoot;
    protected _destroyed = false;

    private _renderers;
    private _dataControlListeners;

    onInit() {
        // formcontrol
        this.formControl = new JSEFormControl();
        this.formControl.onDataChange.listen((data) => {
            this.dataChange.emit(data);
        });
        this.formControl.onDataRefresh.listen((pointer) => {
            this.dataRefresh.emit(pointer);
        });
        // renderers
        if (this.extraRenderers) {
            this._renderers = {...renderers, ...this.extraRenderers};
        } else {
            this._renderers = {...renderers};
        }
        // attributes
        this.attributes = this.attributes || {};
        // renderer factory
        this.rendererFactory = new JSERendererFactory(this._renderers);
        // injector
        this.injector.providers([{
            token: 'jse_renderer_factory',
            use: this.rendererFactory,
        }, {
            token: 'jse_attributes',
            use: this.attributes,
        }])
        // dataControl
        this._dataControlListeners = [];
        if (this.dataControl) {
            this._dataControlListeners.push(this.dataControl.onRefresh.listen(pointer => {
                this.formControl.refresh(pointer);
            }))
        }
        this.reset();
    }

    onChanges(changes) {
        if (!!changes) {
            if ('extraRenderers' in changes) {
                if (this.extraRenderers) {
                    this._renderers = {...renderers, ...this.extraRenderers};
                } else {
                    this._renderers = {...renderers};
                }
            }
            if ('attributes' in changes) {
                this.attributes = this.attributes || {};
                this.injector.provide({
                    token: 'jse_attributes',
                    use: this.attributes,
                });
            }
            if ('schema' in changes || 'object' in changes) {
                this.reset();
            } else if ('indentSize' in changes) {
                this.refs.forEach(ref => ref.ref.setState({indentSize: this.indentSize}));
            }
        }

        if (!!changes && 'dataControl' in changes) {
            this._dataControlListeners.forEach(fn => fn());
            this._dataControlListeners = [];
            if (this.dataControl) {
                this._dataControlListeners.push(this.dataControl.onRefresh.listen(pointer => {
                    this.formControl.refresh(pointer);
                }))
            }
        }
    }
    onDestroy() {
        this._destroyed = true;
        this._dataControlListeners.forEach(fn => fn());
        this._dataControlListeners = [];
        this.formControl && this.formControl.destroy();
        this.refs.forEach(ref => ref.ref.destroy());
        this.refs = [];
    }

    protected reset() {
        if (!this.object || !this.schema) return;
        this.root = createJSERoot(this.schema);
        this.formControl.reset(this.object);
        this.rendererFactory.reset(this._renderers);
        this.resetRefs();
    }
    protected resetRefs() {
        const nodes = this.root.children || [];
        if (nodes.length) {
            const refs = this.refs;
            this.refs = [];
            nodes.forEach(node => {
                const renderer = this.rendererFactory.getRendererType(node);
                if (refs[0] && refs[0].renderer === renderer) {
                    const exist = refs.shift();
                    exist.ref.detach();
                    exist.ref.setState({
                        node: node,
                        formControl: this.formControl,
                        indentSize: this.indentSize,
                    });
                    exist.ref.appendTo(this.container);
                    this.refs.push(exist);
                } else {
                    const ref = this.rendererFactory.getInstance(node, this.container, this.formControl, this.injector, {
                        "[indentSize]": "indentSize"
                    }, {
                        indentSize: this.indentSize
                    });
                    this.refs.push({
                        renderer: renderer,
                        ref: ref,
                    });
                }
            })
            refs.forEach(ref => ref.ref.destroy());
        } else {
            this.refs.forEach(ref => ref.ref.destroy());
            this.refs = [];
        }
    }
}


