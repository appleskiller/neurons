
import { Binding, Property, Element } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { hint_icon } from '../icon/icons';
import { StateChanges } from '../../binding/common/interfaces';
import { IToolTipRef, IToolTipOption } from '../../cdk/popup/interfaces';
import { popupManager } from '../../cdk/popup/manager';

@Binding({
    selector: 'ne-hint',
    template: `
        <div class="ne-hint" #trigger>
            <span #iconDom class="ne-hint-icon">
                <ne-icon class="check-icon" [icon]="icon"></ne-icon>
            </span>
            <span class="ne-hint-content">
                <content/>
            </span>
        </div>
    `,
    style: `
        .ne-hint {
            display: inline-block;
            text-align: center;
        }
    `
})
export class Hint {
    @Property() icon: ISVGIcon = hint_icon;
    @Property() message: string = '';
    @Property() delayTime: number = 500;
    @Property() position: string = 'right';
    @Property() connectElement: HTMLElement;

    @Element('trigger') trigger: HTMLElement;

    private _tooltipRef: IToolTipRef;
    onChanges(changes: StateChanges) {
        if (!changes || 'message' in changes || 'delayTime' in changes || 'position' in changes || 'connectElement' in changes) {
            this._tooltipRef && this._tooltipRef.close();
            this._tooltipRef = null;
            if (this.message) {
                this._tooltipRef = popupManager.tooltip(`
                    {{getMessage()}}
                `, {
                    connectElement: this.connectElement || this.trigger,
                    delayTime: this.delayTime,
                    position: this.position,
                    state: {
                        getMessage: () => this.message
                    }
                });
            }
        }
    }
    onDestroy() {
        this._tooltipRef.close();
    }
}