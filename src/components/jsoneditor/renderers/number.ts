import { NumberInput } from "../../input/number";
import { Binding, Emitter } from "../../../binding";
import { PropertyRendererBase } from "./base";
import { IEmitter } from "neurons-emitter";

@Binding({
    selector: 'ui-jse-number',
    template: `
        <div class="ui-jse-number ui-jse-renderer" jse-renderer="NUMBER"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-title" [style.padding-left]="indentWidth">{{title}}</div>
            <div class="ui-jse-renderer-content">
                <ne-number-input [readonly]="readonly" [min]="min" [max]="max" [(value)]="value"
                    (change)="onValueChange()"
                    (enterPressed)="onEnterPressed($event)"
                    (escPressed)="onEscPressed($event)"
                ></ne-number-input>
            </div>
        </div>
    `,
    style: `
        .ui-jse-number {
            .ne-number-input {
                width: 100%;
                padding: 6px 12px;
                border-top: solid 1px transparent;
                border-left: solid 1px transparent;
                border-right: solid 1px transparent;
                border-radius: 0;
                &:hover {
                    border-top: solid 1px transparent;
                    border-left: solid 1px transparent;
                    border-right: solid 1px transparent;
                }
                &:focus {
                    border-top: solid 1px transparent;
                    border-left: solid 1px transparent;
                    border-right: solid 1px transparent;
                }
            }
        }
    `,
    requirements: [
        NumberInput
    ]
})
export class NumberRenderer extends PropertyRendererBase {

    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() escPressed: IEmitter<KeyboardEvent>;

    min;
    max;
    updateComponent() {
        super.updateComponent();
        this.min = this.node.schema.min;
        this.max = this.node.schema.max;
    }
    onValueChange() {
        this.setValue(this.value);
    }
    onEnterPressed(event) {
        this.enterPressed.emit(event);
    }
    onEscPressed(event) {
        this.escPressed.emit(event);
    }
}

