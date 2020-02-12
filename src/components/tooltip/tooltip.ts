import { Attribute, Property, Element, Inject } from "../../binding/factory/decorator";
import { popupManager } from '../../cdk/popup/manager';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { IElementRef } from '../../binding/common/interfaces';
import { IToolTipRef, IToolTipOption } from '../../cdk/popup/interfaces';

@Attribute({
    selector: 'tooltip',
    hostBinding: {}
})
export class ToolTip {
    @Property() tooltip: string;
    @Property() tooltipDelayTime: number = 500;
    @Property() tooltipPosition: 'mouse' | 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    @Element() element: HTMLElement;

    private _tooltipRef: IToolTipRef;
    onInit() {
        const option = this._createOption();
        this._tooltipRef = popupManager.tooltip(`
            {{getMessage()}}
        `, {
            ...option,
            state: {
                getMessage: () => this.tooltip
            }
        })
    }
    onChanges() {
        const option = this._createOption();
        this._tooltipRef.updateOption(option);
    }
    onDestroy() {
        this._tooltipRef.close();
    }
    private _createOption() {
        return {
            connectElement: this.element,
            delayTime: this.tooltipDelayTime,
            position: this.tooltipPosition
        }
    }
}
