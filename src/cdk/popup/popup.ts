import { IPopupRef, IPopupOverlayRef, IPopupOption, IPopupManager, IPopupPanelRef, IToolTipRef, IToolTipOption } from './interfaces';
import { IElementRef, StateObject, BindingSelector, BindingTemplate, IUIStateStatic } from '../../binding/common/interfaces';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { PopupOverlayRef } from './overlay';
import { PopupPanelRef } from './panel';
import { Style } from '../../binding/factory/decorator';
import { isDefined, isEmpty } from 'neurons-utils';
import { addEventListener } from 'neurons-dom';

export class PopupRef<T extends StateObject> implements IPopupRef<T> {
    constructor(private _manager: IPopupManager, private _container: HTMLElement, public isInternalPopup = false) {
    }
    private _nativeEmitter = new EventEmitter();

    option: IPopupOption<T>;
    overlay: IPopupOverlayRef<T>;
    panel: IPopupPanelRef<T>;

    onOpened: IEmitter<IPopupRef<T>> = emitter('opened', this._nativeEmitter);
    onClosed: IEmitter<IPopupRef<T>> = emitter('closed', this._nativeEmitter);
    onClose: IEmitter<IPopupRef<T>> = emitter('close', this._nativeEmitter);

    open(source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): void {
        this.option = option || {} as IPopupOption<T>;
        this.overlay = this._attachOverlay(this._container, this.option, this.isInternalPopup);
        this.panel = this._attachPanel(this._container, source, this.option, this.isInternalPopup);
        this.overlay.appear();
        this.overlay.onClick.listen(() => {
            if (!this.option.disableClose) {
                // 检查是否可关闭的函数
                if (!this.option.canBeClosed || typeof this.option.canBeClosed !== 'function') {
                    this.close();
                } else {
                    if (!!this.option.canBeClosed()) {
                        this.close();
                    } else {
                        this.panel.shakeup();
                    }
                }
            } else {
                this.panel.shakeup();
            }
        });
        this.panel.opened.listen(() => {
            this.onOpened.emit(this);
        });
        this.panel.beforeClose.listen(() => {
            this.onClose.emit(this);
        });
        this.panel.closed.listen(() => {
            this.onClosed.emit(this);
            this._nativeEmitter.off();
        });
        this.panel.appear();
        // this.overlay.onAppeared.listen(() => {
        //     this.onOpened.emit(this);
        // });
        // this.overlay.onDispear.listen(() => {
        //     this.onClose.emit(this);
        // });
        // this.overlay.onDispeared.listen(() => {
        //     this.onClosed.emit(this);
        //     this._nativeEmitter.off();
        // });
    }
    getState(property?: string): any {
        const instance = this.panel.getState();
        if (!property) return instance ? instance.state : undefined;
        return instance && instance.state ? instance.state[property] : undefined;
    }
    setState(state: any) {
        if (!state) return;
        this.panel.changeState({
            state: state,
        });
    }
    updatePosition(connectElement?: HTMLElement | MouseEvent): void {
        this.panel.updatePosition(connectElement);
    }
    close(): void {
        this.overlay.disappear();
        this.panel.disappear();
    }
    protected _attachOverlay(container: HTMLElement, option?: IPopupOption<T>, isInternalPopup = false): IPopupOverlayRef<T> {
        const overlay = new PopupOverlayRef(container, option, isInternalPopup);
        return overlay;
    }
    protected _attachPanel(container: HTMLElement, source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>, isInternalPopup = false): IPopupPanelRef<T> {
        const panel = new PopupPanelRef(this, container, source, option, isInternalPopup);
        return panel;
    }
}

@Style(`
    .ne-popup-panel.ne-tooltip .ne-popup-panel-content {
        background-color: rgba(0, 0, 0, 0.7);
        color: rgba(255, 255, 255, 1);
        padding: 8px;
        margin: 16px;
        max-width: 300px;
        font-size: 12px;
    }
`)
export class ToolTipRef implements IToolTipRef {
    constructor(private _manager: IPopupManager, private _component: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<any>, option?: IToolTipOption) {
        this._option = this._mergeOption(this._option, option);
        const connectElement = this._option.connectElement;
        if (connectElement && 'nodeType' in connectElement) {
            if (!this._option.position || this._option.position === 'mouse') {
                this._option.position = 'bottomLeft';
                this._followMouse = true;
            } else {
                this._followMouse = false;
            }
            addEventListener(connectElement, 'mouseenter', (e) => {
                this._followMouse ? this.open(e) : this.open();
            });
            addEventListener(connectElement, 'mouseleave', (e) => {
                this.close();
            });
        }
    }
    private _option: IToolTipOption;
    private _ref: IPopupRef<any>;
    private _followMouse = false;
    private _delayTimeId;
    private _durationTimeId;
    private _opening: boolean = false;
    open(connectElement?: HTMLElement | MouseEvent): void {
        clearTimeout(this._delayTimeId);
        clearTimeout(this._durationTimeId);
        connectElement && (this._option.connectElement = connectElement);
        if (!this._ref) {
            this._opening = true;
            const delay = this._option.delayTime;
            if (delay) {
                this._delayTimeId = setTimeout(() => {
                    this._opening = false;
                    this._ref = this._manager.open(this._component, this._option);
                    if (!!this._option.duration) {
                        this._durationTimeId = setTimeout(() => this.close(), this._option.duration)
                    }
                }, delay);
            } else {
                this._opening = false;
                this._ref = this._manager.open(this._component, this._option);
                if (!!this._option.duration) {
                    this._durationTimeId = setTimeout(() => this.close(), this._option.duration)
                }
            }
        } else {
            this._ref.updatePosition(connectElement);
            this._ref.panel.detectChanges();
            if (!!this._option.duration) {
                this._durationTimeId = setTimeout(() => this.close(), this._option.duration)
            }
        }
    }
    updateOption(option?: IToolTipOption): void {
        if (!option || isEmpty(option)) return;
        const needUpdatePanel = 'position' in option
            || 'panelClass' in option
            || 'width' in option
            || 'height' in option
            || 'connectElement' in option
        this._option = this._mergeOption(this._option, option);
        if ('position' in option) {
            if (!this._option.position || this._option.position === 'mouse') {
                this._option.position = 'bottomLeft';
                this._followMouse = true;
            } else {
                this._followMouse = false;
            }
        }
        this._ref && this._ref.panel.changeState(this._option);
    }
    updatePosition(connectElement?: HTMLElement | MouseEvent): void {
        connectElement && (this._option.connectElement = connectElement);
        this._ref && this._ref.updatePosition(connectElement);
        this._ref && this._ref.panel.detectChanges();
    }
    close(): void {
        clearTimeout(this._delayTimeId);
        clearTimeout(this._durationTimeId);
        const ref = this._ref;
        this._ref = null;
        ref && ref.close();
    }
    private _mergeOption(option: IToolTipOption, newOption?: IToolTipOption) {
        newOption = newOption || {};
        const result: any = Object.assign(option || {}, newOption);
        if (isDefined(newOption.delayTime) && newOption.delayTime <= 0) {
            result.delayTime = 0;
        } else {
            result.delayTime = isDefined(newOption.delayTime) ? newOption.delayTime : 500;
        }
        result.panelClass = this._unionTooltipClasses(result.panelClass, newOption.panelClass);
        result.popupMode = 'tooltip';
        result.hasOverlay = false;
        return result;
    }
    private _unionTooltipClasses(classes: string, newClasses: string) {
        let classNames: string[] = (classes || '').trim().match(/[^\x20\t\r\n\f]+/g);
        classNames = classNames || [];
        if (classNames.indexOf('ne-tooltip') === -1) {
            classNames.push('ne-tooltip');
        }
        let newClassNames = (newClasses || '').trim().match(/[^\x20\t\r\n\f]+/g);
        if (newClassNames && newClassNames.length) {
            newClassNames.forEach(c => {
                if (classNames.indexOf(c) === -1) {
                    classNames.push(c);
                }
            });
        }
        return classNames.join(' ');
    }
}
