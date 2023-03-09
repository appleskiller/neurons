import * as icons from "../../icon/icons";
import { SvgIcon } from "../../icon/svgicon";
import { theme } from "../../style/theme";
import { Binding } from "../../../binding";
import { PropertyRendererBase } from "./base";

@Binding({
    selector: 'ui-jse-boolean',
    template: `
        <div class="ui-jse-boolean ui-jse-renderer" jse-renderer="BOOLEAN"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            (click)="onClick()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-content" [class.readonly]="readonly">
                <div class="ui-jse-boolean-name">{{title}}</div>
                <ne-icon class="ui-jse-boolean-toggle" [class.toggle-true]="!!value" [icon]="icon"></ne-icon>
            </div>
        </div>
    `,
    style: `
        .ui-jse-boolean {
            .ui-jse-renderer-content {
                padding: 4px 72px 4px 24px !important;
                cursor: pointer;
                .ui-jse-boolean-name {
                    line-height: 31px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .ui-jse-boolean-toggle {
                    position: absolute;
                    right: 32px;
                    top: 3px;
                    font-size: 24px;
                    color: ${theme.black.light};
                    transition: ${theme.transition.normal('color')};
                    &.toggle-true {
                        color: ${theme.color.primary};
                    }
                }
                &.readonly {
                    cursor: default;
                    .ui-jse-boolean-toggle {
                        opacity: 0.3;
                    }
                }
            }
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class BooleanRenderer extends PropertyRendererBase {

    icon = null;

    updateComponent() {
        super.updateComponent();
        this.icon = this.value === true ? icons.toggle_on : icons.toggle_off;
    }

    onClick() {
        if (this.readonly) return;
        this.setValue(!this.value);
        this.icon = this.value === true ? icons.toggle_on : icons.toggle_off;
    }
}

