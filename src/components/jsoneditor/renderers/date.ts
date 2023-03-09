import { Binding } from "../../../binding";
import { isEmpty } from "neurons-utils";
import { PropertyRendererBase } from "./base";
import { DatePicker } from "../../date/datepicker";

@Binding({
    selector: 'ui-jse-date',
    template: `
        <div class="ui-jse-date ui-jse-renderer" jse-renderer="SELECT"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-title" [style.padding-left]="indentWidth">{{title}}</div>
            <div class="ui-jse-renderer-content">
                <ne-date-picker
                    [readonly]="readonly"
                    [(date)]="value"
                    (change)="onDateChange($event)"
                ></ne-date-picker>
            </div>
        </div>
    `,
    style: `
        .ui-jse-date {
            .ne-date-picker {
                display: block;
                width: 100%;
                text-align: left;
            }
        }
    `,
    requirements: [
        DatePicker
    ]
})
export class DateRenderer extends PropertyRendererBase {
    updateComponent() {
        super.updateComponent();
        const schema = this.node.schema;
    }
    onDateChange() {
        this.setValue(this.value);
    }
}

