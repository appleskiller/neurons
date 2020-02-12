import { IPopupOverlayRef, IPopupOption, PopupMode } from './interfaces';
import { nativeApi } from '../../binding/common/domapi';
import { StateObject, IBindingRef } from '../../binding/common/interfaces';
import { Animation } from '../animation';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { Style } from '../../binding/factory/decorator';
import { bind } from '../../binding';

export interface IPopupOverlayOption<T> extends IPopupOption<T> {
    overlayClass: string;
    animationEnter: boolean;
    animationDone: boolean;
    onClick: Function;
}

@Style(`
    .ne-popup-overlay {
        position: absolute;
        pointer-events: all;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
`)
export class PopupOverlayRef<T extends StateObject> implements IPopupOverlayRef<T> {
    constructor(private _container: HTMLElement, option?: IPopupOption<T>) {
        if (option.hasOverlay !== false) {
            this._placeholder = nativeApi.createComment();
            nativeApi.appendChild(this._container, this._placeholder);
            const state: IPopupOverlayOption<T> = {
                popupMode: PopupMode.modal,
                overlayClass: '',
                overlayBackgroundColor: '',
                animationEnter: false,
                animationDone: false,
                onClick: (e) => {
                    this.onClick.emit(e);
                }
            } as IPopupOverlayOption<T>;
            Object.assign(state, (option || {}));
            this._ref = bind(
                `<div 
                    [class]="{
                        [overlayClass]: true,
                        'ne-popup-overlay': true,
                        'ne-animation': true,
                        'ne-animation-fade': true,
                        'ne-animation-enter': animationEnter,
                        'ne-animation-done': animationDone
                    }"
                    (click)="onClick($event)"
                    [style.backgroundColor]="overlayBackgroundColor || (popupMode === 'modal' ? 'rgba(0, 0, 0, 0.5)' : 'transparent')"
                ></div>`, {
                state: state,
            });
        }
    }
    
    private _nativeEmitter: EventEmitter = new EventEmitter();
    onClick: IEmitter<MouseEvent> = emitter('onClick', this._nativeEmitter);
    onDispear: IEmitter<void> = emitter('onDispear', this._nativeEmitter);
    onDispeared: IEmitter<void> = emitter('onDispeared', this._nativeEmitter);
    onAppeared: IEmitter<void> = emitter('onAppeared', this._nativeEmitter);

    private _ref: IBindingRef<IPopupOverlayOption<T>>;
    private _placeholder;
    private _cancelAnimation;
    private _destroyed = false;
    appear() {
        if (this._destroyed) return;
        this._placeholder && this._ref && this._ref.attachTo(this._placeholder);
        this._ref && this._ref.setState({ animationEnter: true });
        this._cancelAnimation = Animation.start({
            duration: 180,
            onEnter: () => {
                this._ref && this._ref.setState({ animationDone: true });
                this.onAppeared.emit();
            },
            onDone: () => {

            },
        });
    }
    disappear() {
        if (this._destroyed) return;
        this._placeholder && nativeApi.remove(this._placeholder);
        this._cancelAnimation && this._cancelAnimation();
        this._cancelAnimation = Animation.start({
            duration: 120,
            onEnter: () => {
                this._ref && this._ref.setState({ animationDone: false });
                this.onDispear.emit();
            },
            onDone: () => {
                this.onDispeared.emit();
                this._nativeEmitter.off();
                this._ref && this._ref.destroy();
            },
        });
    }
    detectChanges(): void {
        this._ref && this._ref.detectChanges();
    }
}
