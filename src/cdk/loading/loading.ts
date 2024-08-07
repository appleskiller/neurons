import { Style } from '../../binding';
import { asPromise } from 'neurons-utils';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';
import { IPopupManager, IPopupRef } from '../popup/interfaces';
import { PopupManager } from '../popup/manager';
import { createElement } from 'neurons-dom';
import { LoadingMask } from './loadingmask';
import { errorToMessage } from '../../binding/common/exception';
import { alert } from '../../components/dialog';

export interface ILoadingOption {
    mode?: 'alert' | 'modal';
    alertTitle?: string;
    backgroundColor?: string;
    hideCancel?: boolean;
    hideRefresh?: boolean;
}

export interface ILoadingService {
    load<T>(promiseOrObservable: Promise<T> | ObservableLike<T>, container?: HTMLElement, option?: ILoadingOption): Promise<T>;
    retryable<T>(retryFunc: IRetryFunction<T>, container?: HTMLElement, option?: ILoadingOption): Promise<T>;
}
export type IRetryFunction<T> = () => Promise<T> | ObservableLike<T>;

@Style(`
    .ne-popup-host.ne-loading-mask-host {
        z-index: 2000;
    }
    .ne-loading-mask-panel {
        width: 100%;
        height: 100%;
    }
    .ne-popup-panel.ne-loading-mask-panel .ne-popup-panel-content {
        background-color: transparent;
    }
`)
export class LoadingService implements ILoadingService {
    constructor() {
        this._popupManager = new PopupManager();
        this._popupManager.config({
            hostClass: 'ne-loading-mask-host'
        });
    }
    private _popupManager: IPopupManager;
    load<T>(promiseOrObservable: Promise<T> | ObservableLike<T>, container?: HTMLElement, option?: ILoadingOption): Promise<T> {
        return new Promise((resolve, reject) => {
            let popupRef: IPopupRef<any>;
            popupRef = this._popupManager.open(`
                <ne-loading-mask/>
            `, {
                popupMode: 'modal',
                panelClass: 'ne-loading-mask-panel',
                popupContainer: container || null,
                disableAnimation: true,
                hasOverlay: false,
                autoClose: true,
                disableClose: true,
                width: '100%',
                height: '100%',
                state: {},
                requirements: [
                    LoadingMask
                ]
            });
            asPromise(promiseOrObservable).then(result => {
                popupRef && popupRef.close();
                resolve(result);
            }).catch(error => {
                popupRef && popupRef.close();
                reject(error);
            });
        });
    }
    retryable<T>(retryFunc: IRetryFunction<T>, container?: HTMLElement, option?: ILoadingOption): Promise<T> {
        return new Promise((resolve, reject) => {
            let popupRef: IPopupRef<any>;
            let isCanceled = false;
            const state = {
                retryMessage: '',
                hidden: false,
                retryFunction: () => {
                    popupRef && popupRef.panel.changeState({
                        state: {
                            hidden: false,
                            retryMessage: '',
                        }
                    })
                    asPromise(retryFunc())
                    .then(result => {
                        if (isCanceled) return;
                        popupRef && popupRef.close();
                        resolve(result);
                    }).catch(error => {
                        if (error && 'status' in error && error.status == 401) {
                            popupRef && popupRef.close();
                        } else {
                            if (option && option.mode === 'alert') {
                                popupRef && popupRef.panel.changeState({
                                    state: {
                                        hidden: true,
                                        retryMessage: '',
                                    }
                                })
                                alert({
                                    title: option.alertTitle ? option.alertTitle : '请求异常',
                                    body: {
                                        template: `
                                            <div style="padding: 2px 12px; color: red;">{{retryMessage}}</div>
                                        `,
                                        state: {
                                            retryMessage: errorToMessage(error),
                                        }
                                    },
                                    okLabel: '重试',
                                    cancelLabel: '关闭',
                                    hideCancelButton: state.hideCancel,
                                    onOk: () => {
                                        state.retryFunction();
                                    },
                                    onCancel: () => {
                                        popupRef && popupRef.close();
                                    }
                                })
                            } else {
                                popupRef && popupRef.panel.changeState({
                                    state: {
                                        retryMessage: errorToMessage(error),
                                    }
                                })
                            }
                        }
                    });
                },
                cancelFunction: () => {
                    isCanceled = true;
                    popupRef && popupRef.close();
                    reject(new Error('canceled!'));
                },
                backgroundColor: option && option.backgroundColor ? option.backgroundColor : '',
                hideCancel: option && option.hideCancel && !!option.hideCancel,
                hideRefresh: option && option.hideRefresh && !!option.hideRefresh,
            }
            popupRef = this._popupManager.open(`
                <ne-loading-mask
                    *if="!hidden"
                    [hideCancel]="hideCancel"
                    [hideRefresh]="hideRefresh"
                    [retryMessage]="retryMessage"
                    [retryFunction]="retryFunction"
                    [cancelFunction]="cancelFunction"
                    [style.background-color]="backgroundColor"
                />
            `, {
                popupMode: 'modal',
                panelClass: 'ne-loading-mask-panel',
                popupContainer: container || null,
                disableAnimation: true,
                hasOverlay: false,
                autoClose: true,
                disableClose: true,
                state: state,
                width: '100%',
                height: '100%',
                requirements: [
                    LoadingMask
                ]
            });
            state.retryFunction();
        });
    }
}
