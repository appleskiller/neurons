

import { Input } from "../../input/input";
import { Binding, Element, Property } from "../../../binding";
import { PropertyRendererBase } from "./base";
import { JSERendererFactory } from "../factory";
import { IBindingRef } from "../../../binding/common/interfaces";
import { createJSEPropertiesNodes } from "../jsenodeutil";
import { IJSENode, IJSERoot } from "../interfaces";
import { SvgIcon } from "../../icon/svgicon";
import { ISVGIcon } from "neurons-dom/dom/element";
import { caret_down } from "../../icon/icons";
import { theme } from "../../style/theme";
import { isDefined, requestFrame } from "neurons-utils";

@Binding({
    selector: 'ui-jse-section',
    template: `
        <div class="ui-jse-section" jse-renderer="SECTION"
            [no-title]="!!title ? null : ''"
            [class.expanded]="expanded"
            [class.has-children]="!!hasChildren"
        >
            <div class="ui-jse-section-title"
                [style.padding-left]="indentWidth"
                (mouseenter)="showTooltip($event.currentTarget)"
                (mouseleave)="hideTooltip()"
                (click)="onOpenClose()"
            >
                <ne-icon *if="!!hasChildren" class="ui-jse-section-title-icon" [style.margin-left]="indentWidth" [icon]="caretIcon"></ne-icon>
                <div class="ui-jse-section-title-label">{{title}}</div>
            </div>
            <div class="ui-jse-section-content" #container></div>
        </div>
    `,
    style: `
        .ui-jse-section {
            position: relative;
            user-select: none;
            &:last-child {
                border-bottom: none;
            }
            & > .ui-jse-section-title {
                position: relative;
                transition: ${theme.transition.normal('background-color')};
                line-height: 31px;
                &:hover {
                    background-color: ${theme.gray.light};
                }
                
                .ui-jse-section-title-icon {
                    position: absolute;
                    left: 0;
                    top: 5px;
                    width: 24px;
                    transform: rotate(-90deg);
                    transition: ${theme.transition.normal('transform')};
                }
                .ui-jse-section-title-label {
                    padding: 4px 24px 4px 24px;
                    box-sizing: border-box;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                }
            }
            & > .ui-jse-section-content {
                position: relative;
                transition: ${theme.transition.normal('height')};
                overflow: hidden;
            }
            &.has-children {
                & > .ui-jse-section-title {
                    cursor: pointer;
                }
            }
            &[no-title] {
                & > .ui-jse-section-title {
                    display: none;
                }
            }
            &.expanded > .ui-jse-section-title > .ui-jse-section-title-icon {
                transform: rotate(0deg);
            }
        }
    `,
    requirements: [
        Input,
        SvgIcon
    ]
})
export class SectionRenderer extends PropertyRendererBase {
    
    @Element('container') container: HTMLElement;

    protected expanded: boolean = false;
    protected hasChildren: boolean = false;
    protected caretIcon: ISVGIcon = caret_down;
    protected needResetRefs: boolean = false;

    protected stopExpandedAnimation = null;
    protected nodes: IJSENode[] = [];
    protected refs: {renderer: string, ref: IBindingRef<any>}[] = [];

    onChanges(changes) {
        if (!changes || 'indentSize' in changes) {
            this.refs.forEach(ref => ref.ref.setState({indentSize: this.indentSize}));
        }
        super.onChanges(changes);
    }

    onDestroy() {
        super.onDestroy();
        if (this.stopExpandedAnimation) {
            this.stopExpandedAnimation();
            this.stopExpandedAnimation = null;
        }
        this.refs.forEach(ref => ref.ref.destroy());
        this.refs = [];
    }

    updateComponent() {
        super.updateComponent();
        if (this.stopExpandedAnimation) {
            this.stopExpandedAnimation();
            this.stopExpandedAnimation = null;
        }
        this.nodes = createJSEPropertiesNodes(this.node.schema, this.node.root, this.node, this.node.pointer, this.node.schemaPointer, this.node.depth + 1);
        this.hasChildren = !!this.nodes.length;
        // 如果no title则直接展开
        this.expanded = this.expanded || !this.title;
        this.container.style.height = this.expanded ? null : '0';
        this.resetRefs();
    }
    protected onOpenClose() {
        if (this.stopExpandedAnimation) {
            this.stopExpandedAnimation();
            this.stopExpandedAnimation = null;
        }
        this.expanded = !this.expanded;
        if (this.expanded) {
            if (this.needResetRefs) {
                this.resetRefs();
            }
            this.stopExpandedAnimation = this.animateOpenClose();
        } else {
            this.stopExpandedAnimation = this.animateOpenClose();
        }
    }
    protected resetRefs() {
        if (!this.expanded) {
            this.needResetRefs = true;
            return;
        };
        this.needResetRefs = false;
        if (this.nodes.length) {
            const factory: JSERendererFactory = this.injector.get('jse_renderer_factory') as JSERendererFactory;
            const refs = this.refs;
            this.refs = [];
            this.nodes.forEach(node => {
                const renderer = factory.getRendererType(node);
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
                    const ref = factory.getInstance(node, this.container, this.formControl, this.injector, {
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

    private animateOpenClose() {
        // 测量容器实际高度
        const contentHeight = this.measureContainerHeight();
        const originHeight = this.expanded ? 0 : contentHeight;
        const targetHeight = this.expanded ? contentHeight : 0;
        // 调整为当前高度
        if (!this.container.style.height) {
            this.container.style.height = originHeight + 'px';
        }
        let timeId;
        const applyFinalHeight = () => {
            if (this._destroyed) return;
            // 清除高度
            this.container.style.height = this.expanded ? null : '0';
            this.refs.forEach(ref => ref.ref.resize());
        };
        const stopFrameTime = requestFrame((time) => {
            if (this._destroyed) return;
            // 调整为目标高度
            this.container.style.height = targetHeight + 'px';
            timeId = setTimeout(applyFinalHeight, 280 - time);
        });
        return () => {
            if (this._destroyed) return;
            stopFrameTime();
            clearTimeout(timeId);
            applyFinalHeight();
        };
    }

    private measureContainerHeight() {
        const originHeight = this.container.style.height;
        this.container.style.height = null;
        const result = this.container.clientHeight;
        this.container.style.height = originHeight;
        return result;
    }
}

