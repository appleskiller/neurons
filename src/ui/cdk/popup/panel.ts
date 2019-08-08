import { IPopupPanelRef, IPopupOption, PopupPosition, PopupAnimation, PopupMode, TOKENS, IPopupRef } from './interfaces';
import { nativeApi } from '../../compiler/common/domapi';
import { StateEntries, IElementRef, UIBindingTemplate, UIBindingSelector, IUIStateStatic, IUIState, StateChanges, IChangeDetector, IBindingDefinition } from '../../compiler/common/interfaces';
import { ClassLike } from '../../../helper/injector';
import { UIBinding, Property, Inject, Emitter } from '../../factory/decorator';
import { bindingFactory } from '../../factory/factory';
import { Animation } from '../animation';
import { popupPositionStyle, popupPosition2AnimationType } from './postion';
import { isBrowser, isDefined } from '../../../utils';
import { globalY, globalX, getPixel } from '../../../utils/domutils';
import { BINDING_TOKENS } from '../../factory/injector';
import { unionRect, GeometryRect } from '../../../utils/geometryutils';
import { IEmitter } from '../../../helper/emitter';

@UIBinding({
    selector: 'ne-popup-panel',
    template: `<div
            [class]="{[panelClass]: true, 'ne-popup-panel': true}" 
            [style]="getContainerStyles()"
        >
            <div [class]="{
                'ne-popup-panel-content': true,
                'ne-animation': animationEnter,
                'ne-animation-fade': true,
                'ne-animation-enter': animationEnter,
                'ne-animation-done': animationDone,
                'ne-animation-fast': animationFast,
                ['ne-animation-' + animationType]: animationType ? true : false,
            }">
                <ne-binding *bind="{'source': source, 'hostBinding': binding}" *state="state"/>
            </div>
        </div>
    `,
    style: `
    .ne-popup-panel {
        position: fixed;
        max-width: 100%;
        max-height: 100%;
    }
    .ne-popup-panel .ne-popup-panel-content {
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 4px;
        background-color: #FFFFFF;
        color: rgba(0, 0, 0, 0.8);
        box-shadow: 0 3px 9px rgba(0, 0, 0, 0.24);
        pointer-events: all;
    }
    `
})
export class PopupPanelState<T extends StateEntries> implements IUIState, IPopupOption<T> {
    constructor() {

    }
    @Property() panelClass = '';
    @Property() autoClose = true;
    @Property() source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T> = null;
    @Property() binding: IBindingDefinition = null;
    @Property() state: T = null;
    @Property() width: number = undefined;
    
    @Property() popupMode: PopupMode = null;
    @Property() position: PopupPosition = null;
    @Property() connectElement?: HTMLElement = null;
    
    @Property() show?: boolean = false;

    @Emitter() hidden: IEmitter<void>;
    
    animationEnter = false;
    animationDone = false;
    animationFast = false;
    relativeTop: string = '';
    relativeLeft: string = '';
    relativeMinWidth: number | string = '';
    relativeWidth: number | string = '';
    animationType: string = '';
    
    private _connectPosition: string = 'bottom';
    
    private _cancelAnimation;
    private _scrollListen;
    private _destroyed;
    private _showen = false;

    @Inject(BINDING_TOKENS.ELEMENTS) elements: HTMLElement[];
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) changeDetector: IChangeDetector;

    private _updateAnimationType() {
        const popupMode = this.popupMode || PopupMode.modal;
        let position = this.position || (popupMode === PopupMode.modal ? PopupPosition.center : PopupPosition.bottomLeft);
        const offset = popupMode === PopupMode.modal ? 4 : 0;
        if (popupMode === PopupMode.dropdown) {
            if (this.connectElement && isBrowser) {
                const box = this.connectElement.getBoundingClientRect();
                const left = globalX(this.connectElement);
                const top = globalY(this.connectElement);
                const width = window.innerWidth;
                const height = window.innerHeight;
                const panelBox = this._getBBox();
                const panelWidth = isDefined(this.width) ? getPixel(this.width, width) : Math.max(panelBox.width, box.width);
                if (position.indexOf('bottom') !== -1) {
                    this._connectPosition = (top + box.height + offset + panelBox.height > height) ? 'top' : 'bottom';
                } else if (position.indexOf('top') !== -1) {
                    this._connectPosition = (top - panelBox.height - offset < 0) ? 'bottom' : 'top';
                }
                if (position === 'left') {
                    this._connectPosition = panelWidth ? 'left' : ((left - panelWidth - offset < 0) ? 'right' : 'left');
                } else if (position === 'right'){
                    this._connectPosition = panelWidth ? 'right' : ((left + box.width + offset + panelWidth > width) ? 'left' : 'right');
                } else if (position === 'center') {
                    this._connectPosition = 'middle';
                }
                if (this._connectPosition === 'top') {
                    this.animationType = PopupAnimation.spreadUp;
                } else if (this._connectPosition === 'bottom') {
                    this.animationType = PopupAnimation.spreadDown;
                } else if (this._connectPosition === 'left') {
                    this.animationType = PopupAnimation.spreadLeft;
                } else if (this._connectPosition === 'right') {
                    this.animationType = PopupAnimation.spreadRight;
                } else if (this._connectPosition === 'middle') {
                    this.animationType = PopupAnimation.spreadMiddle;
                } else {
                    this.animationType = PopupAnimation.spreadDown;
                }
            } else {
                this.animationType = PopupAnimation.spreadDown;
            }
        } else {
            this.animationType = popupPosition2AnimationType[position] || PopupAnimation.scaleUp;
        }
    }
    getContainerStyles() {
        if (!this._showen) return {};
        const popupMode = this.popupMode || PopupMode.modal;
        let position = this.position || (popupMode === PopupMode.modal ? PopupPosition.center : PopupPosition.bottomLeft);
        if (popupMode === PopupMode.dropdown) {
            return {
                '[top]': 'relativeTop',
                '[left]': 'relativeLeft',
                '[minWidth]': 'relativeMinWidth',
                '[width]': 'relativeWidth'
            };
        } else {
            if (position === 'center') {
                return {
                    '[top]': 'relativeTop',
                    '[left]': 'relativeLeft',
                    '[minWidth]': 'relativeMinWidth',
                    '[width]': 'relativeWidth'
                }
            } else {
                return popupPositionStyle[position] || {};
            }
        }
    }
    onInit() {
        this._scrollListen = nativeApi.onHTMLScroll(() => {
            if (!this._showen) return;
            this._updatePosition();
            this.changeDetector.detectChanges();
        });
    }
    onChanges(changes?: StateChanges) {
        // if (!changes || 'connectElement' in changes || 'popupMode' in changes || 'position' in changes) {
        //     setTimeout(() => {
        //         this._updateAnimationType();
        //         this._updatePosition();
        //         this.changeDetector.detectChanges();
        //     })
        // }
        if (this.show) {
            this._show();
        } else {
            this._hide();
        }
    }
    onResize() {
        this._updatePosition();
    }
    onDestroy() {
        this._destroyed = true;
        this._scrollListen && this._scrollListen();
    }
    private _show() {
        if (this._showen) return;
        this._showen = true;
        // 某些需要检测size的子视图会需要在套用animation type之前进行测量。
        this.changeDetector.detectChanges();
        this._updateAnimationType();
        this._updatePosition();
        // this.changeDetector.detectChanges();

        this._cancelAnimation = Animation.start({
            duration: 180,
            onEnter: () => {
                this.animationEnter = true;
                this.animationDone = true;
                this.changeDetector.detectChanges();
            },
            onDone: () => {
                
            },
        });
    }
    private _hide() {
        this._cancelAnimation && this._cancelAnimation();
        if (!this._showen) return;
        this._cancelAnimation = Animation.start({
            duration: 120,
            onEnter: () => {
                this.animationDone = false;
                this.animationFast = true;
                this.changeDetector.detectChanges();
            },
            onDone: () => {
                this._showen = false;
                this.hidden.emit();
            },
        });
    }
    private _getBBox(): GeometryRect {
        let bbox = null;
        this.elements.forEach(element => {
            const box = element.getBoundingClientRect();
            bbox = unionRect(box as GeometryRect, bbox);
        });
        return bbox;
    }
    private _fixPositionFromEnd(position, triggerSize, panelSize, maxSize, offset) {
        let result = position + triggerSize + offset;
        if (result + panelSize > maxSize) {
            // push to other side
            result = Math.max(position - panelSize - offset, 0);
        }
        return result;
    }
    private _fixPositionFromStart(position, triggerSize, panelSize, maxSize, offset) {
        let result = position - panelSize - offset;
        if (result < 0) {
            if (position + triggerSize + panelSize + offset < maxSize) {
                result = Math.min(position + triggerSize + offset, maxSize - panelSize);
            } else {
                result = 0;
            }
        }
        return result;
    }
    private _fixPositionFromCenter(position, triggerSize, panelSize, maxSize) {
        return Math.max(0, Math.min(position - (panelSize - triggerSize) / 2, maxSize - panelSize));
    }
    private _fixPositionFromCenterTop(position, triggerSize, panelSize, maxSize, offset) {
        const result = Math.min(position - (panelSize - triggerSize) / 2, maxSize - panelSize);
        if (result < 0) {
            return this._fixPositionFromEnd(position, triggerSize, panelSize, maxSize, offset);
        }
        if (result + panelSize > maxSize) {
            return this._fixPositionFromStart(position, triggerSize, panelSize, maxSize, offset);
        }
        return result;
    }
    private _updatePosition() {
        const popupMode = this.popupMode || PopupMode.modal;
        let position = this.position || (popupMode === PopupMode.modal ? PopupPosition.center : PopupPosition.bottomLeft);
        const offset = popupMode === PopupMode.modal ? 4 : 0;
        if (popupMode === PopupMode.dropdown) {
            if (this.connectElement && isBrowser) {
                const box = this.connectElement.getBoundingClientRect();
                // const left = globalX(this.connectElement);
                // const top = globalY(this.connectElement);
                const left = box.left;
                const top = box.top;
                const width = window.innerWidth;
                const height = window.innerHeight;
                const panelBox = this._getBBox();
                const panelWidth = isDefined(this.width) ? getPixel(this.width, width) : Math.max(panelBox.width, box.width);
                let relativeTop = null, relativeLeft = null;
                if (position.indexOf('bottom') !== -1) {
                    this._connectPosition = (top + box.height + offset + panelBox.height > height) ? 'top' : 'bottom';
                    relativeTop = this._fixPositionFromEnd(top, box.height, panelBox.height, height, offset);
                    if (position.indexOf('Right') !== -1) {
                        relativeLeft = Math.max(0, Math.min(width - panelWidth, left + box.width - panelWidth));
                    } else if (position.indexOf('Left') !== -1) {
                        relativeLeft = Math.max(0, Math.min(left, width - panelWidth));
                    } else {
                        relativeLeft = this._fixPositionFromCenter(left, box.width, panelWidth, width);
                    }
                } else if (position.indexOf('top') !== -1) {
                    this._connectPosition = (top - panelBox.height - offset < 0) ? 'bottom' : 'top';
                    relativeTop = this._fixPositionFromStart(top, box.height, panelBox.height, height, offset);
                    if (position.indexOf('Right') !== -1) {
                        relativeLeft = Math.max(0, Math.min(width - panelWidth, left + box.width - panelWidth));
                    } else if (position.indexOf('Left') !== -1) {
                        relativeLeft = Math.max(0, Math.min(left, width - panelWidth));
                    } else {
                        relativeLeft = this._fixPositionFromCenter(left, box.width, panelWidth, width);
                    }
                }
                if (position === 'left') {
                    this._connectPosition = (left - panelWidth - offset) ? 'right' : 'left';
                    relativeLeft = this._fixPositionFromStart(left, box.width, panelWidth, width, offset);
                    relativeTop = this._fixPositionFromCenter(top, box.height, panelBox.height, height);
                } else if (position === 'right'){
                    this._connectPosition = (left + box.width + offset + panelWidth > width) ? 'left' : 'right';
                    relativeLeft = this._fixPositionFromEnd(left, box.width, panelWidth, width, offset);
                    relativeTop = this._fixPositionFromCenter(top, box.height, panelBox.height, height);
                } else if (position === 'center') {
                    relativeTop = this._fixPositionFromCenterTop(top, box.height, panelBox.height, height, offset);
                    relativeLeft = this._fixPositionFromCenter(left, box.width, panelWidth, width);
                }
                this.relativeTop = relativeTop === null ? '' : relativeTop + 'px';
                this.relativeLeft = relativeLeft === null ? '' : relativeLeft + 'px';
                if (isDefined(this.width)) {
                    this.relativeMinWidth = '';
                    this.relativeWidth = this.width;
                } else {
                    this.relativeMinWidth = (box.width || 0);
                    this.relativeWidth = '';
                }
            } else {
                this.relativeTop = '';
                this.relativeLeft = '';
                this.relativeMinWidth = '';
                this.relativeWidth = '';
            }
        } else {
            this.relativeTop = '';
            this.relativeLeft = '';
            this.relativeMinWidth = '';
            this.relativeWidth = '';
            if (position === 'center' && isBrowser) {
                const width = window.innerWidth;
                const height = window.innerHeight;
                const panelBox = this._getBBox();
                this.relativeLeft = (width - panelBox.width) / 2 + 'px';
                this.relativeTop = (height - panelBox.height) / 2 + 'px';
            }
        }
    }
}

export class PopupPanelRef<T extends StateEntries> implements IPopupPanelRef<T> {
    constructor(private _popupRef: IPopupRef<T>, private _container: HTMLElement, source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>) {
        this._placeholder = nativeApi.createComment();
        nativeApi.appendChild(this._container, this._placeholder);
        const state = (option || {}) as PopupPanelState<T>;
        state.source = source;
        this._ref = bindingFactory.create(PopupPanelState, state, {
            '[panelClass]': 'panelClass',
            '[autoClose]': 'autoClose',
            '[binding]': 'binding',
            '[state]': 'state',
            '[source]': 'source',
            '[popupMode]': 'popupMode',
            '[position]': 'position',
            '[width]': 'width',
            '[connectElement]': 'connectElement',
            '[show]': 'show',
            '(hidden)': 'onHidden()'
        }, [{
            token: TOKENS.POPUP_REF,
            use: this._popupRef
        }]);
    }
    private _ref: IElementRef<PopupPanelState<T>>;
    private _placeholder;
    private _destroyed = false;
    appear() {
        if (this._destroyed) return;
        this._ref.setState({
            show: true,
            onHidden: () => {
                this._ref.destroy();
            }
        })
        this._ref.attachTo(this._placeholder);
    }
    disappear() {
        if (this._destroyed) return;
        nativeApi.remove(this._placeholder);
        this._ref.setState({
            show: false
        })
        this._destroyed = true;
    }
    updatePosition(): void {
        if (this._destroyed) return;
        this._ref.resize();
    }
    detectChanges(): void {
        this._ref.detectChanges();
    }
}
