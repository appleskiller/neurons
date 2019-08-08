import { IPopupRef, IPopupOverlayRef, IPopupOption, IPopupManager, IPopupPanelRef } from './interfaces';
import { StateObject, IElementRef, StateEntries, UIBindingSelector, UIBindingTemplate, IUIStateStatic } from '../../compiler/common/interfaces';
import { IEmitter, emitter, EventEmitter } from '../../../helper/emitter';
import { PopupOverlayRef } from './overlay';
import { PopupPanelRef } from './panel';

export class PopupRef<T extends StateEntries> implements IPopupRef<T> {
    constructor(private _manager: IPopupManager, private _container: HTMLElement) {
    }
    private _nativeEmitter = new EventEmitter();

    option: IPopupOption<T>;
    overlay: IPopupOverlayRef<T>;
    panel: IPopupPanelRef<T>;

    onOpened: IEmitter<IPopupRef<T>> = emitter('opened', this._nativeEmitter);
    onClosed: IEmitter<IPopupRef<T>> = emitter('closed', this._nativeEmitter);
    onClose: IEmitter<IPopupRef<T>> = emitter('close', this._nativeEmitter);

    open(source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): void {
        this.option = option || {} as IPopupOption<T>;
        this.overlay = this._attachOverlay(this._container, this.option);
        this.panel = this._attachPanel(this._container, source, this.option);
        this.overlay.appear();
        this.panel.appear();
        this.overlay.onClick.listen(() => this.close());
        this.overlay.onAppeared.listen(() => {
            this.onOpened.emit(this);
        });
        this.overlay.onDispear.listen(() => {
            this.onClose.emit(this);
        });
        this.overlay.onDispeared.listen(() => {
            this.onClosed.emit(this);
            this._nativeEmitter.off();
        });
    }
    updatePosition(): void {
        this.panel.updatePosition();
    }
    close(): void {
        this.overlay.disappear();
        this.panel.disappear();
    }
    private _attachOverlay(container: HTMLElement, option?: IPopupOption<T>): IPopupOverlayRef<T> {
        const overlay = new PopupOverlayRef(container, option);

        return overlay;
    }
    private _attachPanel(container: HTMLElement, source: UIBindingSelector | UIBindingTemplate | HTMLElement | IUIStateStatic<T>, option?: IPopupOption<T>): IPopupPanelRef<T> {
        const panel = new PopupPanelRef(this, container, source, option);

        return panel;
    }
}

