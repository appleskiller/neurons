import { IDragScrollOption } from './interfaces';
import { bind } from '../../binding';
import { addEventListener, getScrollSize, getClientSize, naturalScrolling, stopScrolling, appendCSSTagOnce } from 'neurons-dom';
import { arrow_up, arrow_down, arrow_left, arrow_right } from '../../components/icon/icons';
import { scrollController } from './scrollcontrol';
import { IHTMLWidgetStyleSheet } from 'neurons-dom/dom/style';

export interface IDragScrollApi {
    shouldBeScroll(direction: string, start: MouseEvent, current: MouseEvent, distance?: number);
    shouldBeSkip (e: MouseEvent);
    markActive (e: MouseEvent);
    calcScrollDirection(container: HTMLElement, proxySelector?: string): string;
    scrollHorizontal(container: HTMLElement, offset: number, proxySelector?: string);
    scrollVertical(container: HTMLElement, offset: number, proxySelector?: string);
    naturalScrolling(container: HTMLElement, velocity: number[], proxySelector: string);
    attachStyle(container);
    restoreStyle(container);
}

export class DragScrollControler {
    enableDragScroll(container: HTMLElement, option: IDragScrollOption) {
        if (container && option && !this._isEnabled(container)) {
            if (option) {
                container['__enableDragScroll'] = true;
                container['__dragScrollOption'] = option;
                this._attachControl(container, option);
            }
        }
    }
    disableDragScroll(container: HTMLElement) {
        if (container && this._isEnabled(container)) {
            container['__enableDragScroll'] = false;
            this._detachControl(container);
        }
    }
    refreshDragScroll(container: HTMLElement) {
        if (container && this._isEnabled(container)) {
            const option = this._getOption(container);
            const scrollContainer = option.proxySelector ? container.querySelector(option.proxySelector) as HTMLElement : container;
            if (!scrollContainer) return;
            const state = scrollController.measureScroll(scrollContainer);
            container['__refreshControlButtons'] && container['__refreshControlButtons'](state);
        }
    }
    private _attachControl(container: HTMLElement, option: IDragScrollOption) {
        // api
        const api = this._wrapApi(option);
        // button
        let controller;
        if (option.controlButton && option.controlButton !== 'none') {
            controller = this._createControlButtons(container, option, api);
            container['__refreshControlButtons'] = (state) => {
                controller.update(state);
            }
        }
        // event
        const removeListening = this._listenToDragScroll(container, api, option.proxySelector);
        container['__detachControl'] = () => {
            controller && controller.destroy();
            delete container['__refreshControlButtons'];
            this._stopDragging(container);
            removeListening && removeListening();
        }
    }
    private _detachControl(container: HTMLElement) {
        container['__detachControl'] && container['__detachControl']();
        delete container['__detachControl'];
    }
    private _stopDragging(container) {
        container['__stopDragging'] && container['__stopDragging']();
        delete container['__stopDragging'];
    }
    private _listenToDragScroll(container: HTMLElement, api: IDragScrollApi, proxySelector: string = ''): () => void {
        return addEventListener(container, 'mousedown', (e: MouseEvent) => {
            // 取消默认行为
            if (e.defaultPrevented) return;
            container['__stopDragging'] && container['__stopDragging']();
            delete container['__stopDragging'];
            const scrollContainer = proxySelector ? container.querySelector(proxySelector) as HTMLElement : container;
            if (!scrollContainer) return;
            stopScrolling(scrollContainer);
            // 计算滚动方向，如果不是一个可以滚动的容器直接取消
            const direction = api.calcScrollDirection(container, proxySelector);
            if (!direction) return;
            const startEvent = e;
            const startTime = (new Date()).getTime();
            const mouseUpListener = addEventListener(document, 'mouseup', (e: MouseEvent) => {
                const info = container['__scrollingInfo'];
                container['__stopDragging'] && container['__stopDragging']();
                delete container['__stopDragging'];
                if (info) {
                    naturalScrolling(scrollContainer, info.speed);
                    e.preventDefault();
                }
            })
            const mouseMoveListener = addEventListener(document, 'mousemove', (e: MouseEvent) => {
                // 判断是否已经有容器开始进行滚动处理，如果有则取消自身的行为
                if (api.shouldBeSkip(e)) {
                    // stop
                    container['__stopDragging'] && container['__stopDragging']();
                    delete container['__stopDragging'];
                } else {
                    if (container['__scrollingInfo']) {
                        const info = container['__scrollingInfo'];
                        const offsetX = e.clientX - info.previousEvent.clientX;
                        const offsetY = e.clientY - info.previousEvent.clientY;
                        if (direction === '2d' || direction === 'horizontal') {
                            api.scrollHorizontal(container, offsetX, proxySelector);
                        }
                        if (direction === '2d' || direction === 'vertical') {
                            api.scrollVertical(container, offsetY, proxySelector);
                        }
                        const t = (new Date()).getTime();
                        container['__scrollingInfo'] = {
                            previousEvent: e,
                            time: t,
                            offset: [offsetX, offsetY],
                            speed: [offsetX / (t - info.time), offsetY / (t - info.time)],
                        };
                    } else {
                        if (api.shouldBeScroll(direction, startEvent, e)) {
                            api.markActive(e);
                            api.attachStyle(container);
                            container['__scrollingInfo'] = {
                                previousEvent: e,
                                time: (new Date()).getTime(),
                                offset: [0, 0],
                                speed: [0, 0],
                            };
                        }
                    }
                }
            })
            container['__stopDragging'] = () => {
                delete container['__scrollingInfo'];
                api.restoreStyle(container);
                mouseUpListener && mouseUpListener();
                mouseMoveListener && mouseMoveListener();
            }
        });
    }
    private _createControlButtons(container: HTMLElement, option: IDragScrollOption, api: IDragScrollApi) {
        const scrollContainer = option.proxySelector ? container.querySelector(option.proxySelector) as HTMLElement : container;
        if (!scrollContainer) return {
            destroy: () => { },
            update: (e) => { }
        };
        appendCSSTagOnce('ne-drag-scroll', `
            .ne-drag-scroll-button {
                transition: background-color 280ms cubic-bezier(.4,0,.2,1);
                background-color: transparent;
                user-select: none;
                cursor: pointer;
            }
            .ne-drag-scroll-button:hover {
                background-color: rgba(125, 125, 125, 0.12);
            }
            .ne-drag-scroll-button:active {
                background-color: rgba(125, 125, 125, 0.24);
            }
        `)
        const speed = (option && 'controlScrollSpeed' in option) ? option.controlScrollSpeed : 1.5;
        const controls = [];
        let isVertical = false, isHorizontal = false;
        let up, down, left, right;
        if (option.direction === '2d' || option.direction === 'horizontal') {
            left = bind(`
                <div class="ne-drag-scroll-button ne-drag-scroll-left-button"
                    style="position: absolute; left: 0; top: 0; bottom: 0;"
                    [style.display]="hidden ? 'none' : 'block'"
                    (mousedown)="onMousedown($event)"
                >
                    <ne-icon [icon]="icon"/>
                </div>
            `, {
                container: container,
                state: {
                    icon: arrow_left,
                    hidden: false,
                    onMousedown: (e: MouseEvent) => {
                        api.naturalScrolling(container, [speed, 0], option.proxySelector);
                        e.preventDefault();
                    }
                }
            });
            right = bind(`
                <div class="ne-drag-scroll-button ne-drag-scroll-right-button"
                    style="position: absolute; right: 0; top: 0; bottom: 0;"
                    [style.display]="hidden ? 'none' : 'block'"
                    (mousedown)="onMousedown($event)"
                >
                    <ne-icon [icon]="icon"/>
                </div>
            `, {
                container: container,
                state: {
                    icon: arrow_right,
                    hidden: false,
                    onMousedown: (e: MouseEvent) => {
                        api.naturalScrolling(container, [-speed, 0], option.proxySelector);
                        e.preventDefault();
                    }
                }
            });
            controls.push(left);
            controls.push(right);
            isHorizontal = true;
        }
        if (option.direction === '2d' || option.direction === 'vertical') {
            up = bind(`
                <div class="ne-drag-scroll-button ne-drag-scroll-up-button"
                    style="position: absolute; top: 0; left: 0; right: 0;"
                    [style.display]="hidden ? 'none' : 'block'"
                    (mousedown)="onMousedown($event)"
                >
                    <ne-icon [icon]="icon"/>
                </div>
            `, {
                container: container,
                state: {
                    icon: arrow_up,
                    hidden: false,
                    onMousedown: (e: MouseEvent) => {
                        api.naturalScrolling(container, [0, speed], option.proxySelector);
                        e.preventDefault();
                    }
                }
            });
            down = bind(`
                <div class="ne-drag-scroll-button ne-drag-scroll-down-button"
                    style="position: absolute; bottom: 0; left: 0; right: 0;"
                    [style.display]="hidden ? 'none' : 'block'"
                    (mousedown)="onMousedown($event)"
                >
                    <ne-icon [icon]="icon"/>
                </div>
            `, {
                container: container,
                state: {
                    icon: arrow_down,
                    hidden: false,
                    onMousedown: (e: MouseEvent) => {
                        api.naturalScrolling(container, [0, -speed], option.proxySelector);
                        e.preventDefault();
                    }
                }
            });
            controls.push(up);
            controls.push(down);
            isVertical = true;
        }
        if (controls.length) {
            const removeFn = scrollController.onScroll(scrollContainer, (e) => {
                up && up.setState({ hidden: e.isOnTop });
                down && down.setState({ hidden: e.isOnBottom });
                left && left.setState({ hidden: e.isOnLeft });
                right && right.setState({ hidden: e.isOnRight });
            });
            return {
                destroy: () => {
                    removeFn();
                    controls.forEach(ref => ref.destroy());
                },
                update: (e) => {
                    up && up.setState({ hidden: e.isOnTop });
                    down && down.setState({ hidden: e.isOnBottom });
                    left && left.setState({ hidden: e.isOnLeft });
                    right && right.setState({ hidden: e.isOnRight });
                }
            };
        } else {
            return {
                destroy: () => { },
                update: (e) => { }
            };
        }
    }
    private _wrapApi(option: IDragScrollOption): IDragScrollApi {
        return {
            shouldBeScroll: function (direction: string, start: MouseEvent, current: MouseEvent, distance: number = 4) {
                if (direction === 'horizontal') {
                    return start && current && Math.abs(current.clientX - start.clientX) >= distance;
                } else if (direction === '2d') {
                    return start && current && Math.sqrt(Math.pow(current.clientX - start.clientX, 2) + Math.pow(current.clientY - start.clientY, 2)) >= distance;
                } else {
                    return start && current && Math.abs(current.clientY - start.clientY) >= distance;
                }
            },
            calcScrollDirection: function (container: HTMLElement, proxySelector: string = '') {
                container = proxySelector ? container.querySelector(proxySelector) : container;
                if (!container) return '';
                const size = getClientSize(container);
                const scrollSize = getScrollSize(container);
                const horizontal = !isNaN(scrollSize.width) && !isNaN(scrollSize.width) && scrollSize.width > size.width;
                const vertical = !isNaN(scrollSize.height) && !isNaN(scrollSize.height) && scrollSize.height > size.height;
                const calculated = (horizontal && vertical) ? '2d' : (horizontal ? 'horizontal' : (vertical ? 'vertical' : ''));
                if (!calculated) return '';
                if (!option.direction || option.direction === '2d') return calculated;
                if (calculated === '2d') return option.direction;
                return option.direction === calculated ? calculated : '';
            },
            shouldBeSkip: function (e: MouseEvent) {
                return e && e['__dragscrollActived'];
            },
            markActive: function (e: MouseEvent) {
                e['__dragscrollActived'] = true;
            },
            scrollHorizontal: function (container: HTMLElement, offset: number, proxySelector: string = '') {
                if (offset) {
                    container = proxySelector ? container.querySelector(proxySelector) : container;
                    if (!container) return;
                    container.scrollLeft -= offset;
                }
            },
            scrollVertical: function (container: HTMLElement, offset: number, proxySelector: string = '') {
                if (offset) {
                    container = proxySelector ? container.querySelector(proxySelector) : container;
                    if (!container) return;
                    container.scrollTop -= offset;
                }
            },
            naturalScrolling: function (container: HTMLElement, velocity: number[], proxySelector: string = '') {
                container = proxySelector ? container.querySelector(proxySelector) : container;
                if (!container) return;
                naturalScrolling(container, velocity);
            },
            attachStyle(container: HTMLElement) {
                const cache = container['__dragScrollStyle'] = {};
                const style = container.style;
                const styles = <CSSStyleDeclaration>{
                    
                }
                Object.keys(styles).forEach(key => {
                    cache[key] = style[key] || '';
                    style[key] = styles[key];
                });
            },
            restoreStyle(container: HTMLElement) {
                const cache = container['__dragScrollStyle'] || {};
                const style = container.style;
                Object.keys(cache).forEach(key => {
                    style[key] = cache[key];
                });
                delete container['__dragScrollStyle'];
            }
        }
    }
    private _isEnabled(container: HTMLElement) {
        return !!container['__enableDragScroll'];
    }
    private _getOption(container: HTMLElement) {
        return container['__dragScrollOption'];
    }
}