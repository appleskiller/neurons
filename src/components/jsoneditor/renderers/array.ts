import { bind, Binding, BINDING_TOKENS, Element, Inject, Property} from "../../../binding";
import { PropertyRendererBase } from "./base";
import * as icons from "../../icon/icons";
import { isArray, moveIndexTo, switchIndexTo, requestFrame } from "neurons-utils";
import { createElement, hasClass, removeClass } from "neurons-dom";
import { IBindingRef, IChangeDetector } from "../../../binding/common/interfaces";
import { theme } from "../../style/theme";
import { Button } from "../../button/button";
import { Input } from "../../input/input";
import { SvgIcon } from "../../icon/svgicon";
import { dragManager, DropPosition } from "../../../cdk";
import { IJSEFormControl, IJSENode } from "../interfaces";
import { createJSEItemsNode, createJSEItemsNodes, createJSEPropertiesNodes, updateJSEItemsNodeIndex } from "../jsenodeutil";
import { JSERendererFactory } from "../factory";
import { IInjector } from "neurons-injector";

@Binding({
    selector: 'ui-jse-array',
    template: `
        <div class="ui-jse-array" jse-renderer="ARRAY"
            [no-title]="!!title ? null : ''"
            [class.expanded]="expanded"
        >
            <div class="ui-jse-array-title"
                [style.padding-left]="indentWidth"
                (mouseenter)="showTooltip($event.currentTarget)"
                (mouseleave)="hideTooltip()"
                (click)="onOpenClose()"
            >
                <ne-icon class="ui-jse-array-title-icon" [style.margin-left]="indentWidth" [icon]="caretIcon"></ne-icon>
                <div class="ui-jse-array-title-label">{{title}}</div>
            </div>
            <div class="ui-jse-array-content" #container>
                <div class="ui-jse-array-list" #list [style.display]="hasChildren ? 'block' : 'none'"></div>
                <div class="ui-jse-array-add" [style.margin-left]="indentWidth" *if="!readonly">
                    <ne-button mode="stroked" color="primary" (click)="onClickAdd()"><ne-icon [icon]="addIcon"></ne-icon>增加项目</ne-button>
                </div>
            </div>
        </div>
    `,
    style: `
        .ui-jse-array {
            position: relative;
            user-select: none;
            &:last-child {
                border-bottom: none;
            }
            & > .ui-jse-array-title {
                position: relative;
                transition: ${theme.transition.normal('background-color')};
                line-height: 31px;
                cursor: pointer;
                &:hover {
                    background-color: ${theme.gray.light};
                }
                
                .ui-jse-array-title-icon {
                    position: absolute;
                    left: 0;
                    top: 5px;
                    width: 24px;
                    transform: rotate(-90deg);
                    transition: ${theme.transition.normal('transform')};
                }
                .ui-jse-array-title-label {
                    padding: 4px 24px 4px 24px;
                    box-sizing: border-box;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                }
            }
            & > .ui-jse-array-content {
                position: relative;
                transition: ${theme.transition.normal('height')};
                overflow: hidden;
                .ui-jse-array-list {
                    user-select: none;
                }
                .ui-jse-array-add {
                    line-height: 19px;
                    padding-left: 24px;
                    .ne-button {
                        display: block;
                        width: 100%;
                        .ne-icon {
                            margin-right: 4px;
                        }
                    }
                }
            }
            &[no-title] {
                & > .ui-jse-array-title {
                    display: none;
                }
            }
            &.expanded > .ui-jse-array-title > .ui-jse-array-title-icon {
                transform: rotate(0deg);
            }
        }
    `,
    requirements: [
        Button,
        Input,
        SvgIcon
    ]
})
export class ArrayRenderer extends PropertyRendererBase {

    @Element('container') container: HTMLElement;
    @Element('list') list: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    caretIcon = icons.caret_down;

    protected needResetRefs: boolean = false;
    protected hasChildren: boolean = false;
    protected nodes: IJSENode[] = [];
    protected stopExpandedAnimation = null;
    protected expanded: boolean = true;
    protected refs: IBindingRef<any>[] = [];

    onInit() {
        this.injector.provide({
            token: 'array_list_callbacks',
            use: {
                onClickRemove: this.onClickRemove.bind(this),
                onDragRemove: this.onDragRemove.bind(this),
                onDragSort: this.onDragSort.bind(this),
                onNextFocus: this.onNextFocus.bind(this)
            }
        })
    }

    onChanges(changes) {
        if (!changes || 'indentSize' in changes) {
            this.refs.forEach(ref => ref.setState({indentSize: this.indentSize}));
        }
        super.onChanges(changes);
    }

    onDestroy() {
        super.onDestroy();
        if (this.stopExpandedAnimation) {
            this.stopExpandedAnimation();
            this.stopExpandedAnimation = null;
        }
        this.refs.forEach(ref => ref.destroy());
        this.refs = [];
    }

    updateComponent() {
        super.updateComponent();
        if (this.stopExpandedAnimation) {
            this.stopExpandedAnimation();
            this.stopExpandedAnimation = null;
        }
        const datas = this.value || [];
        this.formControl.setValue(this.node.pointer, datas, true);
        this.nodes = createJSEItemsNodes(datas, this.node.schema, this.node.root, this.node, this.node.pointer, this.node.schemaPointer, this.node.depth + 1);
        this.hasChildren = !!this.nodes.length;
        this.container.style.height = this.expanded ? null : '0';
        this.resetRefs();
    }
    protected onClickAdd() {
        if (this.readonly) return;
        const datas = this.formControl.getValue(this.node.pointer);
        const nextIndex = datas.length;
        this.formControl.addValue(`${this.node.pointer}.${nextIndex}`, undefined);
        const items = this.node.schema ? this.node.schema.items : { type: "string" };
        const newNode = createJSEItemsNode(nextIndex, items, this.node.root, this.node, this.node.pointer, this.node.schemaPointer, this.node.depth + 1);
        this.nodes.push(newNode);
        if (this.expanded) {
            this.refs.push(this.createItemRenderer(newNode));
        } else {
            this.needResetRefs = true;
        }
        this.hasChildren = !!this.nodes.length;
    }
    protected onClickRemove(node: IJSENode) {
        let index = this.nodes.indexOf(node);
        if (index !== -1) {
            this.formControl.deleteValue(`${this.node.pointer}.${index}`);
            this.nodes.splice(index, 1);
            this.refs[index].destroy();
            this.refs.splice(index, 1);
            for (let i = index; i < this.nodes.length; i++) {
                updateJSEItemsNodeIndex(this.nodes[i], this.node.pointer, i);
            }
        }
    }
    protected onDragRemove(node: IJSENode) {
        this.onClickRemove(node);
    }
    protected onDragSort(draggingNode: IJSENode, targetIndex: number, position: 'before' | 'after' | 'switch') {
        const draggingIndex = this.nodes.indexOf(draggingNode);
        if (targetIndex !== -1 && draggingIndex !== -1) {
            const datas = this.formControl.getValue(this.node.pointer);
            if (position === 'before') {
                moveIndexTo(datas, draggingIndex, targetIndex);
            } else if (position === 'after') {
                moveIndexTo(datas, draggingIndex, targetIndex + 1);
            } else if (position === 'switch') {
                const data = datas[draggingIndex];
                datas[draggingIndex] = datas[targetIndex];
                datas[targetIndex] = data;
            }
            this.formControl.refresh(this.node.pointer);
            this.formControl.notify(this.node.pointer);
        }
    }
    protected onNextFocus(node: IJSENode) {
        let index = this.nodes.indexOf(node);
        let focusNext: HTMLElement;
        if (index >= this.nodes.length - 1) {
            index = this.nodes.length - 1;
            this.onClickAdd();
            this.cdr.detectChanges();
            focusNext = this.list.children.item(index).nextElementSibling as HTMLElement;
        } else if (index !== -1) {
            focusNext = this.list.children.item(index).nextElementSibling as HTMLElement;
        }
        if (focusNext) {
            const input = focusNext.querySelector('input') as HTMLInputElement;
            input && input.focus();
        }
    }
    protected resetRefs() {
        if (!this.expanded) {
            this.needResetRefs = true;
            return;
        };
        this.needResetRefs = false;
        if (this.nodes.length) {
            const refs = this.refs;
            this.refs = [];
            this.nodes.forEach(node => {
                if (refs[0]) {
                    const exist = refs.shift();
                    exist.detach();
                    exist.setState({
                        node: node,
                        formControl: this.formControl,
                        indentSize: this.indentSize,
                        readonly: this.readonly,
                    });
                    exist.appendTo(this.list);
                    this.refs.push(exist);
                } else {
                    this.refs.push(this.createItemRenderer(node));
                }
            })
            refs.forEach(ref => ref.destroy());
        } else {
            this.refs.forEach(ref => ref.destroy());
            this.refs = [];
        }
    }
    protected createItemRenderer(node: IJSENode) {
        return bind(`
            <ui-jse-array-item
                [node]="node"
                [formControl]="formControl"
                [indentSize]="indentSize"
                [readonly]="readonly"
            ></ui-jse-array-item>
        `, {
            parentInjector: this.injector,
            container: this.list,
            state: {
                node: node,
                formControl: this.formControl,
                indentSize: this.indentSize,
                readonly: this.readonly,
            },
            requirements: [
                ArrayItemRenderer
            ]
        });
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
            // this.refs.forEach(ref => ref.ref.resize());
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

@Binding({
    selector: 'ui-jse-array-item',
    template: `
        <div class="ui-jse-array-item">
            <div class="ui-jse-array-item-dragdrop-marker"><ne-icon [icon]="switchIcon"></ne-icon></div>
            <ne-icon class="ui-jse-array-item-drag-handle" *if="!readonly" [style.width]="indentWidth + 18" [icon]="handleIcon" (mousedown)="onMouseDown($event)"></ne-icon>
            <div class="ui-jse-array-item-inffix" #container></div>
            <ne-button class="ui-jse-array-item-del-btn" *if="!readonly" (click)="onClickRemove()"><ne-icon [icon]="deleteIcon"></ne-icon></ne-button>
        </div>
    `,
    style: `
        .ui-jse-array-item {
            position: relative;
            border-radius: 3px;
            border: dashed 1px transparent;
            box-sizing: border-box;
            .ui-jse-array-item-drag-handle {
                position: absolute;
                top: 0;
                left: 0;
                width: 18px;
                height: 36px;
                z-index: 1;
                cursor: move;
                text-align: right;
                padding-top: 5px;
            }
            .ui-jse-array-item-inffix {
                .ui-jse-renderer {
                    padding: 0;
                }
            }
            .ui-jse-array-item-del-btn {
                position: absolute;
                top: 4px;
                right: 0;
                z-index: 1;
                padding: 5px 3px;
                &:not([readonly]):not(.disabled):not([disabled]):hover {
                    color: ${theme.color.error};
                }
            }
            .ui-jse-array-item-dragdrop-marker {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 10;
                display: none;
                text-align: center;
                .ne-icon {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    height: 22px;
                    margin: auto;
                    color: ${theme.color.primary};
                }
            }
        }
    `,
    requirements: [
        
    ]
})
export class ArrayItemRenderer  {

    @Property() node: IJSENode;
    @Property() formControl: IJSEFormControl;

    @Property() indentSize: number = 24;
    @Property() readonly: boolean = false;

    @Element('container') container: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;
    @Inject(BINDING_TOKENS.INJECTOR) injector: IInjector;

    handleIcon = icons.drag_handle;
    deleteIcon = icons.trash;
    addIcon = icons.plus;
    switchIcon = icons.switch_icon;
    
    protected indentWidth = 0;
    protected ref: {renderer?: string, ref?: IBindingRef<any>} = {};

    onChanges(changes) {
        if (!changes || 'node' in changes || 'formControl' in changes || 'indentSize' in changes) {
            this.indentWidth = this.node ? this.indentSize * this.node.depth : 0;
            if (this.node) {
                const factory: JSERendererFactory = this.injector.get('jse_renderer_factory') as JSERendererFactory;
                const renderer = factory.getRendererType(this.node);
                if (renderer === this.ref.renderer) {
                    this.ref.ref.setState({
                        node: this.node,
                        formControl: this.formControl,
                        indentSize: this.indentSize,
                    })
                } else {
                    this.ref.ref && this.ref.ref.destroy();
                    this.ref.renderer = renderer;
                    this.ref.ref = factory.getInstance(this.node, this.container, this.formControl, this.injector, {
                        "[indentSize]": "indentSize",
                        "(enterPressed)": "onEnterPressed($event)"
                    }, {
                        indentSize: this.indentSize,
                        onEnterPressed: this.onEnterPressed.bind(this)
                    });
                }
            } else {
                this.ref.ref && this.ref.ref.destroy();
                this.ref = {};
            }
        }
    }

    onClickRemove() {
        if (this.readonly) return;
        const callbacks: any = this.injector.get('array_list_callbacks');
        callbacks && callbacks.onClickRemove && callbacks.onClickRemove(this.node);
    }

    onMouseDown(event: MouseEvent) {
        if (this.readonly) return;
        const el = (event.currentTarget as HTMLElement).parentElement;
        const container = el.parentElement;
        const children = [];
        for (let i = 0; i < container.children.length; i++) {
            const e = container.children.item(i) as HTMLElement;
            hasClass(e, 'ui-jse-array-item') && children.push(e);
        }
        dragManager.draggable(el, {
            scope: 'ui-jse-array-item',
            data: this.node,
            direction: 'y',
            onDragStart: (dragSource) => {
                const dom = createElement('div');
                const clone = el.cloneNode(true) as HTMLElement;
                removeClass(clone, 'ne-dragging');
                dom.appendChild(clone);
                dragSource.placeholderElement = dom;
            },
            onDragStop: () => {
                dragManager.clearDrag(el);
                dragManager.clearDrop(container);
                children.forEach(e => dragManager.clearDrop(e));
            }
        });
        children.forEach((e, elIndex) => dragManager.droppable(e, {
            scope: 'ui-jse-array-item',
            detecting: {
                [DropPosition.top]: {y: '30%', height: '-30%'},
                [DropPosition.intersected]: {y: '30%', height: '40%'},
                [DropPosition.bottom]: {y: '-30%', height: '30%'},
            },
            onDrop: (position, dragSource) => {
                const node = dragSource.data;
                const callbacks: any = this.injector.get('array_list_callbacks');
                const pos = position === DropPosition.top ? 'before'
                    : position === DropPosition.bottom ? 'after'
                    : position === DropPosition.intersected ? 'switch'
                    : null
                callbacks && callbacks.onDragSort && callbacks.onDragSort(node, elIndex, pos);
            }
        }));
        dragManager.droppable(container, {
            scope: 'ui-jse-array-item',
            detecting: {
                [DropPosition.outside]: {},
            },
            onDrop: (position, dragSource) => {
                if (this.readonly) return;
                const callbacks: any = this.injector.get('array_list_callbacks');
                callbacks && callbacks.onDragRemove && callbacks.onDragRemove(this.node);
            }
        })
    }
    onEnterPressed(event: MouseEvent) {
        if (this.readonly) return;
        const callbacks: any = this.injector.get('array_list_callbacks');
        callbacks && callbacks.onNextFocus && callbacks.onNextFocus(this.node);
    }
}


