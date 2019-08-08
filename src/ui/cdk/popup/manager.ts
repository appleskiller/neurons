import { IPopupRef, IPopupOption, IPopupManager, IPopupManagerConfig } from './interfaces';
import { StateObject, IUIStateStatic, UIBindingTemplate, UIBindingSelector } from '../../compiler/common/interfaces';
import { uniqueId, isBrowser, isEmpty } from '../../../utils';
import { PopupRef } from './popup';
import { nativeApi } from '../../compiler/common/domapi';
import { appendCSSTagOnce } from '../../../utils/domutils';
import { Style } from '../../factory/decorator';

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
`)
export class PopupManager implements IPopupManager {
    private _inited = false;
    private _config: IPopupManagerConfig = {};
    private _popups = [];
    private _container: HTMLElement;
    config(option: IPopupManagerConfig): void {
        Object.assign(this._config, option);
    }
    open<T extends StateObject>(component: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): IPopupRef<T> {
        this._validateInitialize();
        const popup = new PopupRef<T>(this, this._container);
        this._addPopup(popup);
        popup.open(component, option);
        return popup;
    }
    close() {
        this._popups.forEach(popup => popup.close());
    }
    updatePosition(): void {
        this._popups.forEach(popup => popup.updatePosition());
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
                nativeApi.addEventListener(window, 'hashchange', () => {
                    Object.values(this._popups).forEach(popup => {
                        if (!popup.option || popup.option.autoClose !== false) {
                            popup.close()
                        }
                    });
                });
                nativeApi.addEventListener(window, 'popstate', () => {
                    Object.values(this._popups).forEach(popup => {
                        if (!popup.option || popup.option.autoClose !== false) {
                            popup.close()
                        }
                    });
                });
            }
        }
    }
}

export const popupManager = new PopupManager();

