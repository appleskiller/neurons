import { IPopupRef, IPopupOption, IPopupManager, IPopupManagerConfig, IToolTipRef, IToolTipOption } from './interfaces';
import { StateObject, IUIStateStatic, BindingTemplate, BindingSelector } from '../../binding/common/interfaces';
import { PopupRef, ToolTipRef } from './popup';
import { nativeApi } from '../../binding/common/domapi';
import { Style } from '../../binding/factory/decorator';
import { removeMe } from 'neurons-dom';
import { isEmpty, isBrowser, moveItemTo } from 'neurons-utils';

const sortedPopups: IPopupRef<any>[] = [];
function addToPopups(popup: IPopupRef<any>) {
    if (!popup) return;
    const index = sortedPopups.indexOf(popup);
    if (index === -1) {
        sortedPopups.push(popup);
    } else {
        moveItemTo(sortedPopups, popup, sortedPopups.length)
    }
}
function removeFromPopups(popup: IPopupRef<any>) {
    if (!popup) return;
    const index = sortedPopups.indexOf(popup);
    if (index !== -1) {
        sortedPopups.splice(index, 1);
    }
}

let windowListenerAttached = false;
function attachWindowListener() {
    if (isBrowser && !windowListenerAttached) {
        windowListenerAttached = true;
        nativeApi.addEventListener(window, 'hashchange', () => {
            sortedPopups.forEach(popup => {
                if (!popup.option || popup.option.autoClose !== false) {
                    popup.close()
                }
            });
        });
        nativeApi.addEventListener(window, 'popstate', () => {
            sortedPopups.forEach(popup => {
                if (!popup.option || popup.option.autoClose !== false) {
                    popup.close()
                }
            });
        })
        nativeApi.addEventListener(window, 'keyup', (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;
            if (e.keyCode === 27 && sortedPopups.length) {
                const popup = sortedPopups[sortedPopups.length - 1];
                if (!popup.option || popup.option.disableClose !== false) {
                    popup.close();
                }
            }
        })
    }
}


@Style(`
    .ne-popup-host {
        position: fixed;
        pointer-events: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        overflow: hidden;
    }
    .ne-popup-host.empty {
        display: none;
    }
    .ne-click-shake-up {
        transform: scale(1.02);
    }
`)
export class PopupManager implements IPopupManager {
    private _inited = false;
    private _config: IPopupManagerConfig = {};
    private _popups = [];
    private _container: HTMLElement;
    private _listeners = [];
    config(option: IPopupManagerConfig): void {
        Object.assign(this._config, option);
    }
    open<T extends StateObject>(component: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): IPopupRef<T> {
        this._validateInitialize();
        const container = option && option.popupContainer ? option.popupContainer : this._container;
        const popup = new PopupRef<T>(this, container, this._container !== container);
        this._addPopup(popup);
        popup.open(component, option);
        return popup;
    }
    close() {
        this._popups.forEach(popup => popup.close());
    }
    tooltip(component: BindingSelector | BindingTemplate | HTMLElement | IUIStateStatic<any>, option?: IToolTipOption): IToolTipRef {
        return new ToolTipRef(this, component, option);
    }
    updatePosition(): void {
        this._popups.forEach(popup => popup.updatePosition());
    }
    destroy() {
        this._listeners.forEach(fn => fn());
        this.close();
        removeMe(this._container);
    }
    private _addPopup(popup: IPopupRef<any>) {
        addToPopups(popup);
        if (this._popups.indexOf(popup) === -1) {
            this._popups.push(popup);
            !popup.isInternalPopup && nativeApi.removeClass(this._container, 'empty');
            popup.onClosed.listen(() => {
                this._removePopup(popup);
                if (isEmpty(this._popups.filter(popup => !popup.isInternalPopup))) {
                    nativeApi.addClass(this._container, 'empty');
                }
            })
        }
    }
    private _removePopup(popup) {
        removeFromPopups(popup);
        const index = this._popups.indexOf(popup);
        if (index !== -1) {
            this._popups.splice(index, 1);
        }
    }
    private _validateInitialize() {
        if (!this._inited) {
            this._inited = true;
            if (isBrowser) {
                const container = this._config.container || window.document.body;
                const hostClass = this._config.hostClass ? `ne-popup-host ${this._config.hostClass}` : 'ne-popup-host';
                this._container = nativeApi.createElement('div', hostClass);
                container.appendChild(this._container);
                attachWindowListener();
            }
        }
    }
}

export const popupManager = new PopupManager();

