import { Binding } from "../../../binding";
import { PropertyRendererBase } from "./base";

@Binding({
    selector: 'ui-jse-unknown',
    template: `
        <div class="ui-jse-unknown ui-jse-renderer" jse-renderer="UNKNOWN"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-title" [style.padding-left]="indentWidth">{{title}}</div>
            <div class="ui-jse-renderer-content">
                <div>{{value}}</div>
            </div>
        </div>
    `,
    style: `
    `,
    requirements: []
})
export class UnknownRenderer extends PropertyRendererBase {
}

