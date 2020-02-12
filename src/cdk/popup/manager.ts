import { IPopupRef, IPopupOption, IPopupManager, IPopupManagerConfig, IToolTipRef, IToolTipOption } from './interfaces';
import { StateObject, IUIStateStatic, BindingTemplate, BindingSelector } from '../../binding/common/interfaces';
import { PopupRef, ToolTipRef } from './popup';
import { nativeApi } from '../../binding/common/domapi';
import { Style } from '../../binding/factory/decorator';
import { removeMe } from 'neurons-dom';
import { isEmpty, isBrowser } from 'neurons-utils';

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
        const popup = new PopupRef<T>(this, this._container);
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
        if (this._popups.indexOf(popup) === -1) {
            this._popups.push(popup);
            nativeApi.removeClass(this._container, 'empty');
            popup.onClosed.listen(() => {
                this._removePopup(popup);
                if (isEmpty(this._popups)) {
                    nativeApi.addClass(this._container, 'empty');
                }
            })
        }
    }
    private _removePopup(popup) {
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
                this._container = nativeApi.createElement('div', 'ne-popup-host');
                container.appendChild(this._container);
                this._listeners.push(nativeApi.addEventListener(window, 'hashchange', () => {
                    Object.values(this._popups).forEach(popup => {
                        if (!popup.option || popup.option.autoClose !== false) {
                            popup.close()
                        }
                    });
                }));
                this._listeners.push(nativeApi.addEventListener(window, 'popstate', () => {
                    Object.values(this._popups).forEach(popup => {
                        if (!popup.option || popup.option.autoClose !== false) {
                            popup.close()
                        }
                    });
                }));
            }
        }
    }
}

export const popupManager = new PopupManager();

