import { popupManager, PopupManager } from '../../cdk/popup/manager';
import { IPopupRef, IToolTipOption, IToolTipRef } from '../../cdk/popup/interfaces';
import { theme } from '../style/theme';
import { BindingSelector, BindingTemplate, IUIStateStatic, IBindingDefinition } from '../../binding/common/interfaces';
import { isEmpty, isPromise } from 'neurons-utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { ClassLike } from 'neurons-injector';

export interface IAlertOption {
    title?: string;
    message?: string;
    html?: string;
    body?: {
        template: string;
        state: any;
    },
    okLabel?: string;
    okColor?: string;
    cancelLabel?: string;
    onOk?: () => void | boolean | any;
    onCancel?: () => void;
    onClosed?: () => void;
    hideOkButton?: boolean;
    hideCancelButton?: boolean;

    middleLabel?: string;
    onMiddle?: () => void;
    hideMiddleButton?: boolean;

    disableOkButton?: boolean;
    disableMiddleButton?: boolean;
    disableCancelButton?: boolean;

    panelClass?: string;
    width?: number | string;
    hasOverlay?: boolean;
    overlayClass?: string;
    overlayBackgroundColor?: string;
    autoClose?: boolean;
    disableClose?: boolean;

    requirements?: ClassLike[];
}

export interface IToastOption {

}

export interface IModalOption {
    title?: string;
    body: {
        source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<any>;
        hostBinding?: IBindingDefinition,
        state?: any;
    };
    okLabel?: string;
    cancelLabel?: string;
    onOk?: () => any;
    onCancel?: () => void;
    onClosed?: () => void;
    hideOkButton?: boolean;
    hideCancelButton?: boolean;

    disableOkButton?: boolean;
    disableCancelButton?: boolean;

    panelClass?: string;
    position?: 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
    width?: number | string;
    hasOverlay?: boolean;
    overlayClass?: string;
    overlayBackgroundColor?: string;
    autoClose?: boolean;
    disableClose?: boolean;

    requirements?: ClassLike[];

    [key: string]: any;
}

export interface ISidePanelOption {
    title?: string;
    body: {
        source: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<any>;
        hostBinding?: IBindingDefinition,
        state?: any;
    };
    okLabel?: string;
    cancelLabel?: string;
    onOk?: () => any;
    onCancel?: () => void;
    onClosed?: () => void;
    hideOkButton?: boolean;
    hideCancelButton?: boolean;

    disableOkButton?: boolean;
    disableCancelButton?: boolean;

    panelClass?: string;
    position?: 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
    width?: number | string;
    height?: number | string;
    hasOverlay?: boolean;
    overlayClass?: string;
    overlayBackgroundColor?: string;
    autoClose?: boolean;
    disableClose?: boolean;

    popupContainer?: HTMLElement;

    requirements?: ClassLike[];
}

export interface IChangeableAlertOption {
    title?: string;
    width?: number | string;
    okLabel?: string;
    middleLabel?: string;
    cancelLabel?: string;
    hideOkButton?: boolean;
    hideMiddleButton?: boolean;
    hideCancelButton?: boolean;
    disableOkButton?: boolean;
    disableMiddleButton?: boolean;
    disableCancelButton?: boolean;
}

export interface IAlertPopupRef extends IPopupRef<any> {
    setOption(option: IChangeableAlertOption): void;
}

export function alert(option: IAlertOption): IAlertPopupRef {
    let ref;
    const state = {
        title: option.title || '',
        message: option.message || '',
        html: option.html || '',
        okColor: 'okColor' in option ? option.okColor : 'primary',
        okLabel: 'okLabel' in option ? option.okLabel : '确定',
        cancelLabel: 'cancelLabel' in option ? option.cancelLabel : '取消',
        middleLabel: 'middleLabel' in option ? option.middleLabel : '关闭',
        hideOkButton: 'hideOkButton' in option ? option.hideOkButton : false,
        hideCancelButton: 'hideCancelButton' in option ? option.hideCancelButton : false,
        hideMiddleButton: 'hideMiddleButton' in option ? option.hideMiddleButton : !option.middleLabel,
        disableOkButton: 'disableOkButton' in option ? option.disableOkButton : false,
        disableMiddleButton: 'disableMiddleButton' in option ? option.disableMiddleButton : false,
        disableCancelButton: 'disableCancelButton' in option ? option.disableCancelButton : false,
        btnCount: () => {
            let btnCount = 0;
            !state.hideOkButton && (btnCount += 1);
            !state.hideCancelButton && (btnCount += 1);
            !state.hideMiddleButton && (btnCount += 1);
            return btnCount;
        },
        onOk: () => {
            if (option.onOk) {
                const result = option.onOk();
                if (result !== false && !result) {
                    ref.close();
                } else {
                    if (isPromise(result)) {
                        result.then(() => ref.close());
                    }
                }
            } else {
                ref.close();
            }
        },
        onCancel: () => {
            option.onCancel && option.onCancel();
            ref.close();
        },
        onMiddle: () => {
            option.onMiddle && option.onMiddle();
            ref.close();
        },
        innerTemplate: option.body ? option.body.template : '',
        innerState: option.body ? option.body.state : {},
    }
    ref = popupManager.open(`
    <div class="ne-dialog ne-alert"
        [class.hide-title]="!title"
        [class.hide-message]="${!option.html && !option.message ? 'true' : 'false'}"
        [class.hide-ok]="hideOkButton"
        [class.hide-cancel]="hideCancelButton"
        [class.hide-middle]="hideMiddleButton"
        [class.button-count-3]="btnCount() === 3"
        [class.button-count-2]="btnCount() === 2"
        [class.button-count-1]="btnCount() === 1"
    >
        <div class="ne-dialog-title">
            <div>{{title}}</div>
        </div>
        <div class="ne-dialog-body">
            <div *if="!!message" class="ne-dialog-message">{{message}}</div>
            <div *if="!message && !!html" class="ne-dialog-message" [innerHTML]="html"></div>
            <ne-binding *if="!!innerTemplate || !!innerState" [source]="innerTemplate" [state]="innerState"/>
        </div>
        <div class="ne-dialog-footer">
            <ne-button class="ne-dialog-cancel-btn" [disabled]="disableCancelButton" (click)="onCancel()">{{cancelLabel}}</ne-button>
            <ne-button class="ne-dialog-middle-btn" [disabled]="disableMiddleButton" (click)="onMiddle()">{{middleLabel}}</ne-button>
            <ne-button class="ne-dialog-ok-btn" [disabled]="disableOkButton" [mode]="'flat'" [color]="okColor" (click)="onOk()">{{okLabel}}</ne-button>
        </div>
    </div>`, {
        autoClose: option.autoClose !== false,
        disableClose: option.disableClose === true,
        hasOverlay: 'hasOverlay' in option ? option.hasOverlay : true,
        overlayClass: 'overlayClass' in option ? option.overlayClass : '',
        overlayBackgroundColor: 'overlayBackgroundColor' in option ? option.overlayBackgroundColor : '',
        panelClass: 'panelClass' in option ? option.panelClass : '',
        width: 'width' in option ? option.width : 460,
        state: state,  
    }) as IAlertPopupRef;
    ref.setOption = (option: IChangeableAlertOption) => {
        if (!option) return;
        const opts: any = {};
        'width' in option && (opts.width = option.width || 600);
        ['title', 'okLabel', 'middleLabel', 'cancelLabel', 'hideOkButton', 'hideMiddleButton', 'hideCancelButton', 'disableCancelButton', 'disableMiddlButton', 'disableOkButton'].forEach(property => {
            if (property in option) {
                opts.state = opts.state || {};
                opts.state[property] = option[property];
            }
        });
        if (isEmpty(opts)) return;
        ref.panel.changeState(opts);
    }
    ref.setState = state => {
        ref.panel.changeState({
            state: {
                innerState: state,
            }
        })
    }
    option.onClosed && ref.onClosed.listen(() => {
        option.onClosed && option.onClosed();
    });
    return ref;
}

export interface IChangeableModalOption {
    title?: string;
    width?: number | string;
    position?: 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
    okLabel?: string;
    cancelLabel?: string;
    hideOkButton?: boolean;
    hideCancelButton?: boolean;
    disableOkButton?: boolean;
    disableCancelButton?: boolean;
}

export interface IModalPopupRef extends IPopupRef<any> {
    setOption(option: IChangeableModalOption): void;
}

export function modal(option: IModalOption): IModalPopupRef {
    const ref = popupManager.open(`<div [class]="{'ne-dialog': true, 'ne-modal': true, 'hide-title': !title, 'hide-ok': hideOkButton, 'hide-cancel': hideCancelButton}">
        <div class="ne-dialog-title">
            <div>{{title}}</div>
        </div>
        <div class="ne-dialog-body">
            <ne-binding [source]="innerSource" [hostBinding]="innerBinding" [state]="innerState"/>
        </div>
        <div class="ne-dialog-footer">
            <ne-button class="ne-dialog-cancel-btn" [disabled]="disableCancelButton" (click)="onCancel()">{{cancelLabel}}</ne-button>
            <ne-button class="ne-dialog-ok-btn" [disabled]="disableOkButton" [mode]="'flat'" [color]="'primary'" (click)="onOk()">{{okLabel}}</ne-button>
        </div>
    </div>`, {
        autoClose: 'autoClose' in option ? option.autoClose : true,
        disableClose: 'disableClose' in option ? option.disableClose : false,
        hasOverlay: 'hasOverlay' in option ? option.hasOverlay : true,
        overlayClass: 'overlayClass' in option ? option.overlayClass : '',
        overlayBackgroundColor: 'overlayBackgroundColor' in option ? option.overlayBackgroundColor : '',
        panelClass: 'panelClass' in option ? option.panelClass : '',
        width: 'width' in option ? option.width : 600,
        position: 'position' in option ? option.position : 'center',
        state: {
            innerSource: option.body.source || '',
            innerBinding: option.body.hostBinding || '',
            innerState: option.body.state || {},
            title: option.title || '',
            okLabel: 'okLabel' in option ? option.okLabel : '确定',
            cancelLabel: 'cancelLabel' in option ? option.cancelLabel : '取消',
            hideOkButton: 'hideOkButton' in option ? option.hideOkButton : false,
            hideCancelButton: 'hideCancelButton' in option ? option.hideCancelButton : false,
            disableOkButton: 'disableOkButton' in option ? option.disableOkButton : false,
            disableCancelButton: 'disableCancelButton' in option ? option.disableCancelButton : false,
            onOk: () => {
                if (option.onOk) {
                    const result = option.onOk();
                    if (result !== false && !result) {
                        ref.close();
                    } else {
                        if (isPromise(result)) {
                            result.then(() => ref.close());
                        }
                    }
                } else {
                    ref.close();
                }
            },
            onCancel: () => {
                option.onCancel && option.onCancel();
                ref.close();
            },
        },
    }) as IModalPopupRef;
    ref.setOption = (option: IChangeableModalOption) => {
        if (!option) return;
        const opts: any = {};
        'width' in option && (opts.width = option.width || 600);
        'position' in option && (opts.position = option.position || 'center');
        ['title', 'okLabel', 'cancelLabel', 'hideOkButton', 'hideCancelButton', 'disableCancelButton', 'disableOkButton'].forEach(property => {
            if (property in option) {
                opts.state = opts.state || {};
                opts.state[property] = option[property];
            }
        });
        if (isEmpty(opts)) return;
        ref.panel.changeState(opts);
    }
    ref.setState = state => {
        ref.panel.changeState({
            state: {
                innerState: state,
            }
        })
    };
    option.onClosed && ref.onClosed.listen(() => {
        option.onClosed && option.onClosed();
    });
    return ref;
}

export interface IChangeableSidePanelOption {
    title?: string;
    width?: number | string;
    height?: number | string;
    position?: 'top' | 'left' | 'bottom' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
    okLabel?: string;
    cancelLabel?: string;
    hideOkButton?: boolean;
    hideCancelButton?: boolean;
    disableOkButton?: boolean;
    disableCancelButton?: boolean;
}

export interface ISidePanelPopupRef extends IPopupRef<any> {
    setOption(option: IChangeableSidePanelOption): void;
}

export function sidePanel(option: ISidePanelOption): ISidePanelPopupRef {
    let manager: PopupManager;
    if (option.popupContainer) {
        manager = new PopupManager();
        manager.config({
            container: option.popupContainer
        });
    } else {
        manager = popupManager;
    }
    const ref = manager.open(`<div [class]="{'ne-dialog': true, 'ne-side-panel': true, 'hide-title': !title, 'hide-ok': hideOkButton, 'hide-cancel': hideCancelButton}">
        <div class="ne-dialog-title">
            <div>{{title}}</div>
        </div>
        <div class="ne-dialog-body">
            <ne-binding [source]="innerSource" [hostBinding]="innerBinding" [state]="innerState"/>
        </div>
        <div class="ne-dialog-footer">
            <ne-button class="ne-dialog-cancel-btn" [disabled]="disableCancelButton" (click)="onCancel()">{{cancelLabel}}</ne-button>
            <ne-button class="ne-dialog-ok-btn" [disabled]="disableOkButton" [mode]="'flat'" [color]="'primary'" (click)="onOk()">{{okLabel}}</ne-button>
        </div>
    </div>`, {
        autoClose: 'autoClose' in option ? option.autoClose : true,
        disableClose: 'disableClose' in option ? option.disableClose : false,
        hasOverlay: 'hasOverlay' in option ? option.hasOverlay : true,
        overlayClass: 'overlayClass' in option ? option.overlayClass : '',
        overlayBackgroundColor: 'overlayBackgroundColor' in option ? option.overlayBackgroundColor : '',
        panelClass: 'panelClass' in option ? `ne-side-panel-modal ${option.panelClass}` : 'ne-side-panel-modal',
        width: 'width' in option ? option.width : null,
        height: 'height' in option ? option.height : null,
        popupMode: 'sidepanel',
        position: 'position' in option ? option.position : 'right',
        state: {
            innerSource: option.body.source || '',
            innerBinding: option.body.hostBinding || '',
            innerState: option.body.state || {},
            title: option.title || '',
            okLabel: 'okLabel' in option ? option.okLabel : '确定',
            cancelLabel: 'cancelLabel' in option ? option.cancelLabel : '取消',
            hideOkButton: 'hideOkButton' in option ? option.hideOkButton : false,
            hideCancelButton: 'hideCancelButton' in option ? option.hideCancelButton : false,
            disableOkButton: 'disableOkButton' in option ? option.disableOkButton : false,
            disableCancelButton: 'disableCancelButton' in option ? option.disableCancelButton : false,
            onOk: () => {
                if (option.onOk) {
                    const result = option.onOk();
                    if (result !== false && !result) {
                        ref.close();
                    } else {
                        if (isPromise(result)) {
                            result.then(() => ref.close());
                        }
                    }
                } else {
                    ref.close();
                }
            },
            onCancel: () => {
                option.onCancel && option.onCancel();
                ref.close();
            },
        },
    }) as ISidePanelPopupRef;
    ref.setOption = (option: IChangeableSidePanelOption) => {
        if (!option) return;
        const opts: any = {};
        'width' in option && (opts.width = option.width);
        'height' in option && (opts.height = option.height);
        'position' in option && (opts.position = option.position || 'right');
        ['title', 'okLabel', 'cancelLabel', 'hideOkButton', 'hideCancelButton', 'disableCancelButton', 'disableOkButton'].forEach(property => {
            if (property in option) {
                opts.state = opts.state || {};
                opts.state[property] = option[property];
            }
        });
        if (isEmpty(opts)) return;
        ref.panel.changeState(opts);
    }
    ref.setState = state => {
        ref.panel.changeState({
            state: {
                innerState: state,
            }
        })
    }
    if (manager !== popupManager) {
        ref.onClosed.listen(() => {
            manager.destroy();
        });
    }
    option.onClosed && ref.onClosed.listen(() => {
        option.onClosed && option.onClosed();
    });
    return ref;
}

export function tooltip(component: string | HTMLElement | IUIStateStatic<any>, option: IToolTipOption): IToolTipRef {
    const ref = popupManager.tooltip(component, option);
    return ref;
}

function toast(option: IToastOption): void {
    
}


appendCSSTagOnce('ne-ui-dialog', `
.ne-dialog .ne-dialog-title {
    position: relative;
    padding: 24px 24px 12px 24px;
    font-size: 17px;
    font-weight: bold;
    box-sizing: border-box;
    user-select: none;
}
.ne-dialog .ne-dialog-body {
    position: relative;
    padding: 12px 24px;
    box-sizing: border-box;
}
.ne-dialog .ne-dialog-footer {
    position: relative;
    margin: 12px 24px;
    box-sizing: border-box;
    text-align: right;
}
.ne-dialog .ne-dialog-footer .ne-button {
    line-height: 27px;
    padding: 6px 24px;
    min-width: 94px;
}
.ne-dialog .ne-dialog-middle-btn {
    border-left: solid 1px ${theme.gray.normal};
    border-right: solid 1px ${theme.gray.normal};
}
.ne-dialog .ne-dialog-close {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 19px;
    width: 58px;
    height: 58px;
}
.ne-dialog.hide-title .ne-dialog-title {
    display: none;
}
.ne-dialog.hide-message .ne-dialog-message {
    display: none;
}
.ne-dialog.hide-ok .ne-dialog-ok-btn {
    display: none;
}
.ne-dialog.hide-cancel .ne-dialog-cancel-btn {
    display: none;
}
.ne-dialog.hide-middle .ne-dialog-middle-btn {
    display: none;
}
.ne-dialog.ne-modal .ne-dialog-footer .ne-button {
    margin-left: 8px;
}
.ne-dialog.ne-alert .ne-dialog-body {
    max-height: 300px;
    overflow: auto;
}
.ne-dialog.ne-alert .ne-dialog-footer {
    margin: 12px 0 0 0;
    border-top: solid 1px ${theme.gray.normal};
}
.ne-dialog.ne-alert .ne-dialog-footer .ne-button {
    width: 50%;
    border-radius: 0;
    vertical-align: bottom;
}
.ne-popup-panel.ne-side-panel-modal .ne-popup-panel-content {
    box-shadow: 0px 0 20px ${theme.black.light};
}
.ne-dialog.ne-side-panel {
    position: relative;
    background-color: ${theme.white.pure};
    width: 100%;
    height: 100%;
    box-sizing: border-box;
}
.ne-dialog.ne-side-panel .ne-dialog-title {
    padding: 18px 24px 18px 24px;
    border-bottom: solid 1px ${theme.gray.normal};
}
.ne-dialog.ne-side-panel .ne-dialog-body {
    position: absolute;
    top: 60px;
    bottom: 74px;
    left: 0;
    right: 0;
    box-sizing: border-box;
    overflow: hidden;
    overflow-y: auto;
}
.ne-dialog.hide-title .ne-dialog-body {
    top: 0;
}
.ne-dialog.ne-side-panel .ne-dialog-footer {
    margin: 12px 24px 24px 24px;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    text-align: right;
}
.ne-dialog.ne-side-panel .ne-dialog-footer .ne-button {
    margin-left: 12px;
}
.ne-dialog.ne-side-panel .ne-dialog-close {
    border-radius: 0;
}
.ne-dialog.ne-alert .ne-dialog-footer .ne-button {
    width: 50%;
}
.ne-dialog.ne-alert.button-count-1 .ne-dialog-footer .ne-button {
    width: 100%;
}
.ne-dialog.ne-alert.button-count-2 .ne-dialog-footer .ne-button {
    width: 50%;
}
.ne-dialog.ne-alert.button-count-3 .ne-dialog-footer .ne-button {
    width: 33.33%;
}
`);