import { IEmitter } from 'neurons-emitter';
import { BindingSelector, BindingTemplate, IUIStateStatic, IBindingDefinition, StateObject, IElementRef } from '../../binding/common/interfaces';
import { ClassLike, IInjector, Provider } from 'neurons-injector';

export const TOKENS = {
    POPUP_REF: 'POPUP_REF'
}

export enum PopupPosition {
    center = 'center',
    top = 'top',
    topLeft = 'topLeft',
    topRight = 'topRight',

    left = 'left',
    leftTop = 'leftTop',
    leftBottom = 'leftBottom',

    right = 'right',
    rightTop = 'rightTop',
    rightBottom = 'rightBottom',

    bottom = 'bottom',
    bottomLeft = 'bottomLeft',
    bottomRight = 'bottomRight',
}

export enum PopupAnimation {
    'scaleUp' = 'scale-up',
    'scaleDown' = 'scale-down',
    'slideUp' = 'slide-up',
    'slideDown' = 'slide-down',
    'slideLeft' = 'slide-left',
    'slideRight' = 'slide-right',
    'slideCenter' = 'slide-center',
    'spreadUp' = 'spread-up',
    'spreadDown' = 'spread-down',
    'spreadLeft' = 'spread-left',
    'spreadRight' = 'spread-right',
    'spreadMiddle' = 'spread-middle',
}

export enum PopupMode {
    'modal' = 'modal',
    'dropdown' = 'dropdown',
    'tooltip' = 'tooltip',
    'sidepanel' = 'sidepanel',
}

export interface IPopupManagerConfig {
    container?: HTMLElement;
    hostClass?: string;
}

export type IConnectPoint = {top: number, left: number} | {x: number, y: number};

export interface IPopupOptionBase {
    panelClass?: string;
    position?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | string;
    width?: number | string;
    height?: number | string;
    popupContainer?: HTMLElement;
    connectElement?: HTMLElement | MouseEvent | IConnectPoint | IElementRef;
    binding?: IBindingDefinition;
    state?: StateObject;
    providers?: Provider[];
    parentInjector?: IInjector;

    requirements?: ClassLike[];
}

export interface IPopupOption<T extends StateObject> extends IPopupOptionBase {
    hasOverlay?: boolean;
    overlayClass?: string;
    overlayBackgroundColor?: string;
    autoClose?: boolean;
    disableClose?: boolean;
    disableAnimation?: boolean;
    disableFadeInOut?: boolean;
    popupMode?: 'modal' | 'dropdown' | 'tooltip' | string;
    canBeClosed?: () => boolean;
    onBeforeOpen?: (popupRef: IPopupRef<any>) => any;
}

export interface IPopupPanelState {
    popupContainer?: HTMLElement;
    panelClass?: string;
    isInternalPopup?: boolean;
    popupMode?: 'modal' | 'dropdown' | 'tooltip' | string;
    position?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | string;
    width?: number | string;
    height?: number | string;
    binding?: IBindingDefinition;
    state?: StateObject;
    onBeforeOpen?: (popupRef: IPopupRef<any>) => any;
}

export interface IToolTipOption extends IPopupOptionBase {
    position?: 'mouse' | 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | string;
    delayTime?: number;
    duration?: number;
}

export interface IPopupOverlayRef<T extends StateObject> {
    onClick: IEmitter<MouseEvent>;
    onDispeared: IEmitter<void>;
    onDispear: IEmitter<void>;
    onAppeared: IEmitter<void>;
    appear();
    disappear();
    detectChanges(): void;
}

export interface IPopupPanelRef<T extends StateObject> {
    opened: IEmitter<void>;
    beforeClose: IEmitter<void>;
    closed: IEmitter<void>;
    shakeup();
    appear();
    disappear();
    changeState(state: IPopupPanelState): void;
    getState(property?: string): IPopupPanelState | any;
    updatePosition(connectElement?: HTMLElement | MouseEvent | IConnectPoint): void;
    detectChanges(): void;
}

export interface IPopupManager {
    config(option: IPopupManagerConfig): void;
    open<T extends StateObject>(component: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): IPopupRef<T>;
    close(): void;
    updatePosition(): void;
}

export interface IPopupRef<T extends StateObject> {
    isInternalPopup: boolean;
    option: IPopupOption<T>;
    overlay: IPopupOverlayRef<T>;
    panel: IPopupPanelRef<T>;
    getState(property?: string): any;
    setState(state: any): void;
    updatePosition(connectElement?: HTMLElement | MouseEvent | IConnectPoint): void;
    open(source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): void;
    close(): void;
    onClose: IEmitter<IPopupRef<T>>;
    onClosed: IEmitter<IPopupRef<T>>;
    onOpened: IEmitter<IPopupRef<T>>;
}

export interface IToolTipRef {
    open(connectElement?: HTMLElement | MouseEvent | IConnectPoint): void;
    updatePosition(connectElement?: HTMLElement | MouseEvent | IConnectPoint): void;
    updateOption(option?: IToolTipOption): void;
    close(): void;
}

export function noop() {};