import { Input } from "../../input/input";
import { Binding, Emitter } from "../../../binding";
import { PropertyRendererBase } from "./base";
import { IEmitter } from "neurons-emitter";

@Binding({
    selector: 'ui-jse-string',
    template: `
        <div class="ui-jse-string ui-jse-renderer" jse-renderer="STRING"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-title" [style.padding-left]="indentWidth">{{title}}</div>
            <div class="ui-jse-renderer-content">
                <ne-input [readonly]="readonly" [(value)]="value"
                    (change)="onValueChange()"
                    (enterPressed)="onEnterPressed($event)"
                    (escPressed)="onEscPressed($event)"
                ></ne-input>
            </div>
        </div>
    `,
    style: `
        .ui-jse-string {
            .ne-input {
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
        Input
    ]
})
export class StringRenderer extends PropertyRendererBase {

    @Emitter() enterPressed: IEmitter<KeyboardEvent>;
    @Emitter() escPressed: IEmitter<KeyboardEvent>;

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

