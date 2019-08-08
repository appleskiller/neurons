import { IEmitter } from '../../../helper/emitter';
import { StateEntries, UIBindingSelector, UIBindingTemplate, IUIStateStatic, IBindingDefinition, StateObject } from '../../compiler/common/interfaces';

export const TOKENS = {
    POPUP_REF: 'POPUP_REF'
}

export enum PopupPosition {
    center = 'center',
    top = 'top',
    left = 'left',
    bottom = 'bottom',
    right = 'right',
    topLeft = 'topLeft',
    topRight = 'topRight',
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
    'spreadUp' = 'spread-up',
    'spreadDown' = 'spread-down',
    'spreadLeft' = 'spread-left',
    'spreadRight' = 'spread-right',
    'spreadMiddle' = 'spread-middle',
}

export enum PopupMode {
    'modal' = 'modal',
    'dropdown' = 'dropdown'
}

export interface IPopupManagerConfig {
    container?: HTMLElement;
}

export interface IPopupOption<T extends StateEntries> {
    overlayClass?: string;
    overlayBackgroundColor?: string;
    panelClass?: string;
    autoClose?: boolean;
    position?: 'center'| 'top'| 'left'| 'bottom'| 'right'| 'topLeft'| 'topRight'| 'bottomLeft'| 'bottomRight' | string;
    popupMode?: 'modal' | 'dropdown' | string;
    width?: number | string;
    connectElement?: HTMLElement;
    binding?: IBindingDefinition;
    state?: StateEntries;
}

export interface IPopupOverlayRef<T extends StateEntries> {
    onClick: IEmitter<MouseEvent>;
    onDispeared: IEmitter<void>;
    onDispear: IEmitter<void>;
    onAppeared: IEmitter<void>;
    appear();
    disappear();
    detectChanges(): void;
}

export interface IPopupPanelRef<T extends StateEntries> {
    appear();
    disappear();
    updatePosition(): void;
    detectChanges(): void;
}

export interface IPopupManager {
    config(option: IPopupManagerConfig): void;
    open<T extends StateObject>(component: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): IPopupRef<T>;
    close(): void;
    updatePosition(): void;
}

export interface IPopupRef<T extends StateEntries> {
    option: IPopupOption<T>;
    overlay: IPopupOverlayRef<T>;
    panel: IPopupPanelRef<T>;
    updatePosition(): void;
    open(source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): void;
    close(): void;
    onClose: IEmitter<IPopupRef<T>>;
    onClosed: IEmitter<IPopupRef<T>>;
    onOpened: IEmitter<IPopupRef<T>>;
}

export function noop() {};