
import { Binding, BINDING_TOKENS, Emitter, Inject, Property } from "../../../binding";
import { IInjector } from "neurons-injector";
import { IJSEFormControl, IJSENode } from "../interfaces";
import { IChangeDetector } from "../../../binding/common/interfaces";
import { IToolTipRef } from "../../../cdk/popup/interfaces";
import { popupManager } from "../../../cdk";
import { IEmitter } from "neurons-emitter";

export class PropertyRendererBase {
    @Property() indentSize: number = 24;
    @Property() node: IJSENode;
    @Property() formControl: IJSEFormControl;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;
    @Inject(BINDING_TOKENS.INJECTOR) injector: IInjector;

    protected title: string = '';
    protected description: string = '';
    protected value: any;
    protected readonly: boolean = false;
    protected required: boolean = false;
    protected indentWidth = 0;

    protected tooltipRef: IToolTipRef;

    protected _destroyed = false;

    private _controlListeners = [];

    onChanges(changes) {
        if (!changes || 'indentSize' in changes) {
            this.indentWidth = this.node ? this.indentSize * this.node.depth : 0;
        }
        if (!changes || 'node' in changes || 'formControl' in changes) {
            this.node && console.log(this.getValue());
            this.resetDisplay();
            this._controlListeners.forEach(fn => fn());
            this._controlListeners = [];
            if (this.formControl) {
                this._controlListeners.push(this.formControl.onDataRefresh.listen(event => {
                    if (!event.pointer || event.pointer === this.node.pointer) {
                        this.resetDisplay();
                        this.cdr.detectChanges();
                    }
                }));
            }
        }
    }
    
    onDestroy() {
        this._destroyed = true;
        this._controlListeners.forEach(fn => fn());
        this._controlListeners = [];
        this.tooltipRef.close();
    }

    updateComponent() {
        const schema = this.node.schema;
        this.title = schema.title || '';
        this.description = schema.description || '';
        this.readonly = schema.readonly === true;
        this.required = schema.required === true;
        this.value = this.getValue();
        this.indentWidth = this.node ? this.indentSize * this.node.depth : 0;

        this.tooltipRef = popupManager.tooltip(this.description, {
            position: 'left',
            width: 240,
        });
    }

    protected resetDisplay() {
        if (this.tooltipRef) {
            this.tooltipRef.close();
            this.tooltipRef = null;
        }
        if (this.node && this.formControl) {
            this.updateComponent();
        }
    }

    protected getAttributes(): any {
        return this.injector.get('jse_attributes');
    }
    protected getValue(): any {
        return this.formControl ? this.formControl.getValue(this.node.pointer) : null;
    }
    protected setValue(value: any): void {
        this.value = value;
        this.formControl && this.formControl.setValue(this.node.pointer, value);
    }

    protected showTooltip(connectElement: HTMLElement | MouseEvent) {
        connectElement && this.description && this.tooltipRef && this.tooltipRef.open(connectElement);
    }
    protected hideTooltip() {
        this.tooltipRef && this.tooltipRef.close();
    }
}

