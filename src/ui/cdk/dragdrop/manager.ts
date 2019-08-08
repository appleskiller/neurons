import { isBrowser, isEmpty, isDefined, moveItemTo } from '../../../utils';
import { EventEmitter } from '../../../helper/emitter';
import { addEventListener, removeMe, addClass, isInDocument, insertBefore, insertAfter, removeClass } from '../../../utils/domutils';
import { tween } from '../../../utils/animationutils';
import { pointIntersectRect } from '../../../utils/geometryutils';
import { IDragSource, IDragConfig, IDraggableOption, IDroppableOption, DropPosition, IDropTouching, IDragMeasure, IDragManager } from './interfaces';

function canDrag(start: MouseEvent, current: MouseEvent, distance: number = 4) {
    return start && current && Math.sqrt(Math.pow(current.clientX - start.clientX, 2) + Math.pow(current.clientY - start.clientY, 2)) >= distance;
}

export class DragManager extends EventEmitter implements IDragManager {

    isDragging = false;
    dragSource: IDragSource;
    beginOffset = 8;

    private _droppableDoms: HTMLElement[] = [];
    private _mouseMoveListener;
    private _mouseUpListener;

    config(opt: IDragConfig) {
        opt = opt || {} as any;
        ('beginOffset' in opt) && (this.beginOffset = opt.beginOffset);
    }
    clearDrag(dom: HTMLElement): void {
        if (!dom) return;
        removeClass(dom, 'ne-dragging');
        if (dom['_draggableListener']) dom['_draggableListener']();
        delete dom['_dragOptions'];
    }
    clearDrop(dom: HTMLElement): void {
        if (!dom) return;
        const index = this._droppableDoms.indexOf(dom);
        if (index !== -1) {
            this._droppableDoms.splice(index, 1);
        }
        delete dom['_dropOptions'];
        delete dom['_measure'];
    }
    draggable(dom: HTMLElement, option?: IDraggableOption): void {
        if (!dom) return;
        if (dom['_draggableListener']) dom['_draggableListener']();
        dom['_draggableListener'] = addEventListener(dom, 'mousedown', (e: MouseEvent) => {
            this.startDrag(dom, e);
        });
        dom['_dragOptions'] = option;
    }
    droppable(dom: HTMLElement, option?: IDroppableOption): void {
        if (!dom) return;
        dom['_dropOptions'] = option;
        const index = this._droppableDoms.indexOf(dom);
        if (index === -1) {
            this._droppableDoms.push(dom);
        }
    }
    stopDrag() {
        if (!isBrowser) return;
        if (this.dragSource) {
            if (this.isDragging) {
                this._onDrop();
                this._clearDragging();
            } else {
                this._clearDragging();
            }
        }
    }
    startDrag(dom: HTMLElement, startEvent: MouseEvent, scope?: string, data?: any) {
        if (!isBrowser || !dom || !startEvent) return;
        this._listenMouseUp();
        if (this.dragSource) {
            if (this.isDragging) {
                this._onMouseUp(startEvent);
            } else {
                this._clearDragging();
            }
        }
        if (!dom['_dragOptions']) {
            dom['_dragOptions'] = {}
        }
        const dragOption = dom['_dragOptions'] as IDraggableOption;
        (arguments.length >= 3) && (dragOption.scope = scope);
        (arguments.length >= 4) && (dragOption.data = data);
        const dragSource: IDragSource = {
            discarded: false,
            scope: typeof dragOption.scope === 'function' ? dragOption.scope() : dragOption.scope,
            data: typeof dragOption.data === 'function' ? dragOption.data() : dragOption.data,
            element: dom,
            dragOption: dragOption,
            startEvent: startEvent,
            // feedback
            feedback: {
                accept: (feedbackData?: any) => {
                    if (dragSource.discarded) return;
                    dragSource.dropMode = 'accept';
                    dragOption.onAccepted && dragOption.onAccepted(feedbackData, dragSource, this);
                },
                drop: (feedbackData?: any) => {
                    if (dragSource.discarded) return;
                    dragSource.dropMode = 'drop';
                    dragOption.onDropped && dragOption.onDropped(feedbackData, dragSource, this);
                },
                revert: (feedbackData?: any) => {
                    if (dragSource.discarded) return;
                    dragSource.dropMode = 'revert';
                    dragOption.onRevert && dragOption.onRevert(feedbackData, dragSource, this);
                },
            },
            // validator
            canDrag: dragOption.canDrag,
            // life hooks
            onDragStart: dragOption.onDragStart,
            onDragging: dragOption.onDragging,
            onDragStop: dragOption.onDragStop,
        }
        this.dragSource = dragSource;
        if (!dragOption.canDrag || dragOption.canDrag(this.dragSource, this)) {
            this._listenMouseMove();
        } else {
            this._clearDragging();
        }
    }
    private _onBeforeDragging() {
        this.dragSource.onDragStart && this.dragSource.onDragStart(this.dragSource, this);
    }
    private _onDragging() {
        this.dragSource.onDragging && this.dragSource.onDragging(this.dragSource, this);
    }
    private _onDrop() {
        // drop revert or accept
        const dragSource = this.dragSource;
        removeClass(dragSource.element, 'ne-dragging');
        const touching = dragSource.touching;
        if (!touching) {
            dragSource.dropMode = 'revert';
            dragSource.feedback.revert(null);
        } else {
            const whatever = touching.whatevers || [];
            let option: IDroppableOption;
            whatever.forEach(element => {
                if (element && element['_dropOptions']) {
                    option = element['_dropOptions'];
                    option.onDrop && option.onDrop(DropPosition.whatever, dragSource, this);
                }
            });
            const element = touching.element;
            if (element && element['_dropOptions']) {
                option = element['_dropOptions'];
                element.removeAttribute('drag-scope');
                element.removeAttribute('drop-touching-mode');
                element.removeAttribute('drop-touching-scope');
                element.removeAttribute('drop-touching-position');
                dragSource.dropMode = option.dropMode || 'drop';
                option.onDrop && option.onDrop(touching.position, dragSource, this);
            } else {
                dragSource.dropMode = 'revert';
                dragSource.feedback.revert(null);
            }
        }
        dragSource.onDragStop && dragSource.onDragStop(dragSource, this);
    }
    private _onTouching() {
        // 更新touch
        const oldTouching: IDropTouching = this.dragSource.touching;
        const touching = this._detectTouching(oldTouching);
        const oldWhatever = (oldTouching && oldTouching.whatevers) ? oldTouching.whatevers : [];

        this.dragSource.touching = touching;

        let option: IDroppableOption;
        touching && touching.whatevers.forEach(element => {
            if (element && element['_dropOptions']) {
                option = element['_dropOptions'];
                const index = oldWhatever.indexOf(element);
                if (index === -1) {
                    // add
                    option.onDragEnter && option.onDragEnter(DropPosition.whatever, this.dragSource, this);
                } else {
                    // update
                    option.onDragMove && option.onDragMove(DropPosition.whatever, this.dragSource, this);
                    oldWhatever.splice(index, 1);
                }
            }
        });
        oldWhatever.forEach(element => {
            // remove
            option = element['_dropOptions'];
            option.onDragLeave && option.onDragLeave(DropPosition.whatever, this.dragSource, this);
        });

        const proxyElement = this.dragSource.proxyElement;
        if (proxyElement) {
            proxyElement.removeAttribute('drop-target');
            proxyElement.removeAttribute('drop-touching-mode');
            proxyElement.removeAttribute('drop-touching-scope');
            proxyElement.removeAttribute('drop-touching-position');
        }
        if (oldTouching) {
            if (touching) {
                if (oldTouching.element !== touching.element || oldTouching.position !== touching.position) {
                    option = oldTouching.element['_dropOptions'];
                    oldTouching.element.removeAttribute('drag-scope');
                    oldTouching.element.removeAttribute('drop-touching-mode');
                    oldTouching.element.removeAttribute('drop-touching-scope');
                    oldTouching.element.removeAttribute('drop-touching-position');
                    option && option.onDragLeave && option.onDragLeave(oldTouching.position, this.dragSource, this);
                    
                    option = touching.element['_dropOptions'];
                    touching.element.setAttribute('drag-scope', this.dragSource.scope || '');
                    touching.element.setAttribute('drop-touching-mode', 'enter');
                    touching.element.setAttribute('drop-touching-scope', option.scope || '');
                    touching.element.setAttribute('drop-touching-position', touching.position);

                    if (proxyElement) {
                        proxyElement.setAttribute('drop-target', option.dropTarget || '');
                        proxyElement.setAttribute('drop-touching-mode', 'enter');
                        proxyElement.setAttribute('drop-touching-scope', option.scope || '');
                        proxyElement.setAttribute('drop-touching-position', touching.position);
                    }

                    this._updatePlaceholderElement(this.dragSource, option, touching);

                    option && option.onDragEnter && option.onDragEnter(touching.position, this.dragSource, this);
                } else {
                    option = touching.element['_dropOptions'];
                    touching.element.setAttribute('drag-scope', this.dragSource.scope || '');
                    touching.element.setAttribute('drop-touching-mode', 'move');
                    touching.element.setAttribute('drop-touching-position', touching.position);

                    if (proxyElement) {
                        proxyElement.setAttribute('drop-target', option.dropTarget || '');
                        proxyElement.setAttribute('drop-touching-mode', 'enter');
                        proxyElement.setAttribute('drop-touching-scope', option.scope || '');
                        proxyElement.setAttribute('drop-touching-position', touching.position);
                    }

                    option && option.onDragMove && option.onDragMove(touching.position, this.dragSource, this);
                }
            } else {
                option = oldTouching.element['_dropOptions'];
                oldTouching.element.removeAttribute('drag-scope');
                oldTouching.element.removeAttribute('drop-touching-mode');
                oldTouching.element.removeAttribute('drop-touching-scope');
                oldTouching.element.removeAttribute('drop-touching-position');

                this._removePlaceholderElement(this.dragSource);

                option && option.onDragLeave && option.onDragLeave(oldTouching.position, this.dragSource, this);
            }
        } else {
            if (touching) {
                option = touching.element['_dropOptions'];
                touching.element.setAttribute('drag-scope', this.dragSource.scope || '');
                touching.element.setAttribute('drop-touching-mode', 'enter');
                touching.element.setAttribute('drop-touching-scope', option.scope || '');
                touching.element.setAttribute('drop-touching-position', touching.position);

                if (proxyElement) {
                    proxyElement.setAttribute('drop-target', option.dropTarget || '');
                    proxyElement.setAttribute('drop-touching-mode', 'enter');
                    proxyElement.setAttribute('drop-touching-scope', option.scope || '');
                    proxyElement.setAttribute('drop-touching-position', touching.position);
                }

                this._updatePlaceholderElement(this.dragSource, option, touching);

                option && option.onDragEnter && option.onDragEnter(touching.position, this.dragSource, this);
            }
        }
    }
    private _onDragStart(e: MouseEvent) {
        if (!this.dragSource.canDrag || !!this.dragSource.canDrag(this.dragSource, this)) {
            this.isDragging = true;
            this.dragSource.moveEvent = e;
            // 準備drop
            this._prepareDrops();
            addClass(this.dragSource.element, 'ne-dragging');
            // 创建代理元素
            this.dragSource.placeholderElement = this._createPlaceholderElement();
            this.dragSource.proxyElement = this._createProxyElement(this.dragSource.element, this.dragSource.scope);
            document.body.appendChild(this.dragSource.proxyElement);
            this.dragSource.measure = this._initMeasure(this.dragSource);
            const dragOption: IDraggableOption = this.dragSource.dragOption;
            this._updatePosition(dragOption, this.dragSource.proxyElement, this.dragSource.measure);
            
            this._onBeforeDragging();
            this._onMouseMoving(e);
        } else {
            this._clearDragging();
        }
    }
    private _onMouseMoving(e: MouseEvent) {
        this.dragSource.moveEvent = e;

        // 更新代理元素
        this._updateMeasure(this.dragSource);
        const dragOption: IDraggableOption = this.dragSource.dragOption;
        this._updatePosition(dragOption, this.dragSource.proxyElement, this.dragSource.measure);
        // 更新drops & touch
        this._measureDrops();
        this._onTouching();

        this._onDragging();
    }
    private _onMouseUp(e: MouseEvent) {
        this.dragSource.moveEvent = e;
        this.dragSource.dropEvent = e;
        // 更新代理元素
        this._updateMeasure(this.dragSource);
        const dragOption: IDraggableOption = this.dragSource.dragOption;
        this._updatePosition(dragOption, this.dragSource.proxyElement, this.dragSource.measure);
        // 更新drops & touch
        this._measureDrops();
        this._onTouching();
        
        this._onDrop();
        this._clearDragging();
    }
    private _clearDragging() {
        this._mouseMoveListener && this._mouseMoveListener();
        this._mouseMoveListener = null;
        if (this.dragSource) {
            this.dragSource.discarded = true;
            removeClass(this.dragSource.element, 'ne-dragging');
            this._removeProxyElement(this.dragSource);
            this._removePlaceholderElement(this.dragSource);
        }
        this.dragSource = null;
        this.isDragging = false;
    }
    private _createProxyElement(el: HTMLElement, scope): HTMLElement {
        const option: IDraggableOption = el['_dragOptions'] || {};
        const wrapper = document.createElement('div');
        const className = option.proxyClass ? `draggable-wrapper ${option.proxyClass}` : `draggable-wrapper`;
        addClass(wrapper, className);
        wrapper.setAttribute('drag-scope', scope || '');
        if (option.proxyElement) {
            wrapper.appendChild(typeof option.proxyElement === 'function' ? option.proxyElement() : option.proxyElement);
        } else {
            wrapper.appendChild(el.cloneNode(true));
        }
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '999999999';
        return wrapper;
    }
    private _removeProxyElement(dragSource: IDragSource) {
        // drop revert or accept
        if (dragSource && dragSource.proxyElement) {
            const dropMode = dragSource.dropMode;
            switch (dropMode) {
                case 'accept':
                case 'drop':
                    this._dropRemoveProxy(dragSource);
                    break;
                case 'revert':
                    this._revertRemoveProxy(dragSource);
                    break;
                default:
                    removeMe(dragSource.proxyElement);
                    break;
            }
        }
    }
    private _dropRemoveProxy(dragSource: IDragSource) {
        if (dragSource && dragSource.proxyElement) {
            const element = dragSource.proxyElement;
            const currentBox = dragSource.measure && dragSource.measure.proxyBox ? dragSource.measure.proxyBox : null;
            const done = () => { removeMe(dragSource.proxyElement) }
            if (currentBox) {
                const opacity = element.style.opacity ? parseInt(element.style.opacity) : 1;
                tween(140, (percent) => {
                    element.style.opacity = opacity * (1 - percent) + '';
                }, done);
            } else {
                done();
            }
        }
    }
    private _revertRemoveProxy(dragSource: IDragSource) {
        if (dragSource && dragSource.proxyElement) {
            const element = dragSource.proxyElement;
            const currentBox = dragSource.measure && dragSource.measure.proxyBox ? dragSource.measure.proxyBox : null;
            const originBox = dragSource.measure && dragSource.measure.originBox ? dragSource.measure.originBox : null;
            const done = () => { removeMe(dragSource.proxyElement) }
            if (currentBox && originBox) {
                const xRange = currentBox.x - originBox.x;
                const yRange = currentBox.y - originBox.y;
                const opacity = element.style.opacity ? parseInt(element.style.opacity) : 1;
                tween(300, (percent) => {
                    element.style.opacity = opacity * (1 - percent) + '';
                    element.style.left = currentBox.x - percent * xRange + 'px';
                    element.style.top = currentBox.y - percent * yRange + 'px';
                }, done);
            } else {
                done();
            }
        }
    }
    private _createPlaceholderElement(): HTMLElement {
        const placeholder = document.createElement('div');
        addClass(placeholder, 'droppable-placeholder');
        return placeholder;
    }
    private _updatePlaceholderElement(dragSource: IDragSource, dropOption: IDroppableOption, touching: IDropTouching) {
        if (!dragSource || !dragSource.placeholderElement || !dropOption || !touching || !touching.element) return;
        const position = touching.position;
        if (position === DropPosition.outside || position === DropPosition.whatever) {
            this._removePlaceholderElement(dragSource);
        } else {
            const placeholder = dragSource.placeholderElement;
            placeholder.className = '';
            addClass(placeholder, 'droppable-placeholder');
            dropOption.placeholderClass && addClass(placeholder, dropOption.placeholderClass);
            placeholder.setAttribute('drag-scope', dragSource.scope || '');
            placeholder.setAttribute('drop-touching-scope', dropOption.scope || '');
            placeholder.setAttribute('drop-touching-position', position);
            if (position === DropPosition.top || position === DropPosition.left) {
                insertBefore(placeholder, touching.element);
            } else {
                insertAfter(placeholder, touching.element);
            }
        }
    }
    private _removePlaceholderElement(dragSource: IDragSource) {
        removeMe(dragSource.placeholderElement);
    }
    private _listenMouseMove() {
        if (!this._mouseMoveListener) {
            this._mouseMoveListener = addEventListener(document, 'mousemove', (e: MouseEvent) => {
                if (this.dragSource) {
                    if (this.isDragging) {
                        this._onMouseMoving(e);
                    } else {
                        if (this.dragSource.startEvent) {
                            if (canDrag(this.dragSource.startEvent, e, this.beginOffset)) {
                                this._onDragStart(e);
                            }
                        } else {
                            this._clearDragging();
                        }
                    }
                } else {
                    this._clearDragging();
                }
            })
        }
    }
    private _listenMouseUp() {
        if (!this._mouseUpListener) {
            this._mouseUpListener = addEventListener(document, 'mouseup', (e: MouseEvent) => {
                if (this.dragSource) {
                    this._onMouseUp(e);
                } else {
                    this._clearDragging();
                }
            })
        }
    }
    private _initMeasure(dragSource: IDragSource): IDragMeasure {
        if (!dragSource) return null;
        const result: IDragMeasure = {} as any;
        const element = dragSource.element;
        const proxy = dragSource.proxyElement;
        const option: IDraggableOption = dragSource.dragOption;
        const isCustomProxy = !!option.proxyElement;
        let box = element.getBoundingClientRect();
        result.originBox = { x: box.left, y: box.top, width: box.width, height: box.height };
        let offsetX = dragSource.moveEvent.clientX - dragSource.startEvent.clientX;
        let offsetY = dragSource.moveEvent.clientY - dragSource.startEvent.clientY;
        if (isCustomProxy) {
            const proxyBox = proxy.getBoundingClientRect();
            if (!proxyBox.width || !proxyBox.height) {
                result.mouseOffset = {x: dragSource.startEvent.clientX - box.left, y: dragSource.startEvent.clientY - box.top};
                result.proxyBox = { x: box.left + offsetX, y: box.top + offsetY, width: box.width, height: box.height };
            } else {
                const scaleX = proxyBox.width / box.width;
                const scaleY = proxyBox.height / box.height;
                const xx = box.left + (dragSource.startEvent.clientX - box.left) * (1 - scaleX);
                const yy = box.top + (dragSource.startEvent.clientY - box.top) * (1 - scaleY);
                result.mouseOffset = {x: dragSource.startEvent.clientX - xx, y: dragSource.startEvent.clientY - yy};
                result.proxyBox = { x: xx + offsetX, y: yy + offsetY, width: proxyBox.width, height: proxyBox.height };
            }
        } else {
            result.mouseOffset = {x: dragSource.startEvent.clientX - box.left, y: dragSource.startEvent.clientY - box.top};
            result.proxyBox = { x: box.left + offsetX, y: box.top + offsetY, width: box.width, height: box.height };
        }
        const direction = option.direction || 'xy';
        const proxyBox = result.proxyBox;
        if (direction === 'y') {
            proxyBox.x = result.originBox.x;
        } else {
            proxyBox.x = result.proxyBox.x;
        }
        if (direction === 'x') {
            proxyBox.y = result.originBox.y;
        } else {
            proxyBox.y = result.proxyBox.y;
        }
        return result;
    }
    private _updateMeasure(dragSource: IDragSource): void {
        if (!dragSource || !dragSource.measure) return null;
        const box = dragSource.measure.originBox;
        const mouseOffset = dragSource.measure.mouseOffset;
        dragSource.measure.proxyBox = {
            x: dragSource.moveEvent.clientX - mouseOffset.x,
            y: dragSource.moveEvent.clientY - mouseOffset.y,
            width: box.width,
            height: box.height,
        };
        const option: IDraggableOption = dragSource.dragOption;
        const direction = option.direction || 'xy';
        const proxyBox = dragSource.measure.proxyBox;
        if (direction === 'y') {
            proxyBox.x = dragSource.measure.originBox.x;
        } else {
            proxyBox.x = dragSource.measure.proxyBox.x;
        }
        if (direction === 'x') {
            proxyBox.y = dragSource.measure.originBox.y;
        } else {
            proxyBox.y = dragSource.measure.proxyBox.y;
        }
    }
    private _updatePosition(dragOption: IDraggableOption, proxyElement: HTMLElement, measure: IDragMeasure) {
        if (!proxyElement || !measure) return;
        proxyElement.style.left = measure.proxyBox.x + 'px';
        proxyElement.style.top = measure.proxyBox.y + 'px';
        proxyElement.style.width = measure.proxyBox.width + 'px';
        proxyElement.style.height = measure.proxyBox.height + 'px';
    }
    private _prepareDrops() {
        for (let i = this._droppableDoms.length - 1; i >= 0; i--) {
            if (!isInDocument(this._droppableDoms[i])) {
                // 清理無效元素及標記
                this._droppableDoms.splice(i, 1);
            }
        }
        this._measureDrops(true);
    }
    private _measureDrops(force: boolean = false) {
        // TODO 後期優化
        // for (let i = this._droppableDoms.length - 1; i >= 0; i--) {
        //     // measure
        //     if (!this._droppableDoms[i]['_measure']) {
        //         this._droppableDoms[i]['_measure'] = {
        //             dirty: false
        //         };
        //     }
        //     if (force) this._droppableDoms[i]['_measure'].dirty = true;
        //     if (this._droppableDoms[i]['_measure'].dirty) {
        //         const box = this._droppableDoms[i].getBoundingClientRect();
        //         this._droppableDoms[i]['_measure'].box = {
        //             x: box.left,
        //             y: box.top,
        //             width: box.width,
        //             height: box.height
        //         }
        //     }
        // }
    }
    private _canDrop(position: DropPosition, dropOption: IDroppableOption, dragSource: IDragSource) {
        if (!dropOption.scope && !dropOption.canDrop) return true;
        if (dropOption.canDrop) {
            return dropOption.canDrop(position, this.dragSource, this);
        }
        if (dropOption.scope) {
            if (!dragSource.scope) return true;
            return dropOption.scope === dragSource.scope;
        }
        return true;
    }
    private _detectTouching(oldTouching: IDropTouching): IDropTouching {
        const dragSource = this.dragSource;
        const dragOption: IDraggableOption = dragSource.dragOption;
        const mousePoint = {x: dragSource.moveEvent.clientX, y: dragSource.moveEvent.clientY};
        let intersected = null;
        let detectRect: any, elementRect, box;
        const doms = this._droppableDoms.concat();
        // clean --------------
        for (let i = doms.length - 1; i >= 0; i--) {
            const option: IDroppableOption = doms[i]['_dropOptions'];
            // 排除並監測
            if (!option) {
                doms.splice(i, 1);
            }
        }
        // whatever --------------
        const whatevers = [];
        for (let i = doms.length - 1; i >= 0; i--) {
            const option: IDroppableOption = doms[i]['_dropOptions'];
            if (option.detecting && option.detecting[DropPosition.whatever]) {
                whatevers.push(doms);
            }
        }
        // intersected --------------
        // 上次的命中如果仍然命中，则不变更
        // 如果当前位置与placeholder相交则取消检测
        if (oldTouching && oldTouching.position && oldTouching.element && dragSource.placeholderElement) {
            box = dragSource.placeholderElement.getBoundingClientRect();
            if (this._pointIntersectRect(dragOption, mousePoint, { x: box.left, y: box.top, width: box.width, height: box.height })) {
                return {
                    position: oldTouching.position,
                    element: oldTouching.element,
                    whatevers: whatevers
                }
            }
        }
        for (let i = doms.length - 1; i >= 0; i--) {
            const option: IDroppableOption = doms[i]['_dropOptions'];
            const detecting = option.detecting && !isEmpty(option.detecting) ? option.detecting : { [DropPosition.intersected]: {} }
            // 監測
            box = doms[i].getBoundingClientRect();
            elementRect = { x: box.left, y: box.top, width: box.width, height: box.height };
            doms[i]['_measure'] = doms[i]['_measure'] || {};
            doms[i]['_measure'].box = elementRect;
            if (!intersected && detecting[DropPosition.intersected]) {
                // intersected
                detectRect = this._calcDetectRect(DropPosition.intersected, detecting[DropPosition.intersected], elementRect);
                if (detectRect && this._pointIntersectRect(dragOption, mousePoint, detectRect) && this._canDrop(DropPosition.intersected, option, this.dragSource)) {
                    intersected = doms[i];
                }
            }
        }
        if (intersected) {
            return {
                position: DropPosition.intersected,
                element: intersected,
                whatevers: whatevers
            }
        }
        // top bottom left right ------------------------------------
        let detecteds = [];
        for (let i = doms.length - 1; i >= 0; i--) {
            const option: IDroppableOption = doms[i]['_dropOptions'];
            const elementRect = doms[i]['_measure'].box;
            // 採集
            Object.keys(option.detecting || {}).forEach((position: DropPosition) => {
                if (position !== DropPosition.intersected && position !== DropPosition.whatever) {
                    detectRect = this._calcDetectRect(position, option.detecting[position], elementRect);
                    if (detectRect) {
                        const pointInterseted = this._pointIntersectRect(dragOption, mousePoint, detectRect)
                        if ((position === DropPosition.outside && !pointInterseted) || (position !== DropPosition.outside && pointInterseted)) {
                            if (this._canDrop(position, option, this.dragSource)) {
                                detecteds.push({
                                    position: position,
                                    element: doms[i],
                                    distance: this._calcDistanceInRect(position, mousePoint, detectRect)
                                })
                            }
                        }
                    }
                }
            })
        }
        // 否则排序，按最短距离确定命中
        detecteds = detecteds.sort((a, b) => {
            return a.distance - b.distance;
        });
        if (detecteds[0]) {
            const position = detecteds[0].position;
            const element = detecteds[0].element;
            return {
                position: position,
                element: element,
                whatevers: whatevers
            }
        }
        return null;
    }
    private _pointIntersectRect(dragOption: IDraggableOption, mousePoint, detectRect) {
        if (dragOption.direction === 'x') {
            mousePoint = {...mousePoint, y: detectRect.y};
            detectRect = {...detectRect, height: 0}
        } else if (dragOption.direction === 'y') {
            mousePoint = {...mousePoint, x: detectRect.x};
            detectRect = {...detectRect, width: 0}
        }
        return pointIntersectRect(mousePoint, detectRect);
    }
    private _calcDistanceInRect(position: DropPosition, point, targetRect) {
        if (position === DropPosition.top) {
            return Math.abs(targetRect.y + targetRect.height - point.y);
        } else if (position === DropPosition.bottom) {
            return Math.abs(targetRect.y - point.y);
        } else if (position === DropPosition.left) {
            return Math.abs(targetRect.x + targetRect.width - point.x);
        } else if (position === DropPosition.right) {
            return Math.abs(targetRect.x - point.x);
        } else if (position === DropPosition.outside) {
            return Math.min(
                Math.abs(targetRect.x - point.x),
                Math.abs(targetRect.x + targetRect.width - point.x),
                Math.abs(targetRect.y - point.y),
                Math.abs(targetRect.y + targetRect.height - point.y),
            )
        }
    }
    private _calcDetectRect(position: DropPosition, offsetRect, targetRect) {
        let detectRect;
        offsetRect = offsetRect || {};
        if (position === DropPosition.intersected || position === DropPosition.outside) {
            detectRect = {
                x: targetRect.x + this._getSize(offsetRect.x, 0, targetRect.width),
                y: targetRect.y + this._getSize(offsetRect.y, 0, targetRect.height),
                width: this._getSize(offsetRect.width, targetRect.width, targetRect.width),
                height: this._getSize(offsetRect.height, targetRect.height, targetRect.height),
            }
        } else if (position === DropPosition.top) {
            // check height
            detectRect = {
                x: targetRect.x + this._getSize(offsetRect.x, 0, targetRect.width),
                y: targetRect.y + this._getSize(offsetRect.y, 0, targetRect.height),
                width: this._getSize(offsetRect.width, targetRect.width, targetRect.width),
                height: this._getSize(offsetRect.height, -999999, targetRect.height),
            }
        } else if (position === DropPosition.bottom) {
            // check height
            detectRect = {
                x: targetRect.x + this._getSize(offsetRect.x, 0, targetRect.width),
                y: targetRect.y + targetRect.height + this._getSize(offsetRect.y, 0, targetRect.height),
                width: this._getSize(offsetRect.width, targetRect.width, targetRect.width),
                height: this._getSize(offsetRect.height, 999999, targetRect.height),
            }
        } else if (position === DropPosition.left) {
            // check width
            detectRect = {
                x: targetRect.x + this._getSize(offsetRect.x, 0, targetRect.width),
                y: targetRect.y + this._getSize(offsetRect.y, 0, targetRect.height),
                width: this._getSize(offsetRect.width, -999999, targetRect.width),
                height: this._getSize(offsetRect.height, targetRect.height, targetRect.height),
            }
        } else if (position === DropPosition.right) {
            // check width
            detectRect = {
                x: targetRect.x + targetRect.width + this._getSize(detectRect.x, 0, targetRect.width),
                y: targetRect.y + this._getSize(detectRect.y, 0, targetRect.height),
                width: this._getSize(offsetRect.width, 999999, targetRect.width),
                height: this._getSize(detectRect.height, targetRect.height, targetRect.height),
            }
        }
        return detectRect;
    }
    private _getSize(value: number | string, defaultValue: number, size: number) {
        if (!isDefined(value) || (typeof value === 'number' && isNaN(value))) return defaultValue;
        value = value + '';
        let sign = 1;
        if (value.charAt(0) === '-') {
            sign = -1;
            value = value.substr(1);
        }
        if (value.indexOf('%') !== -1) {
            return sign * size * parseFloat(value) / 100;
        } else {
            return sign * parseFloat(value);
        }
    }
}

export const dragManager = new DragManager();