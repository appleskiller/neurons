import { nativeApi } from '../common/domapi';
import { CustomElement, IBeforeInitChanges } from './element';

export class ContentElement<T> extends CustomElement<T> {
    constructor(
        // private bindingRef: IBindingRef<T>,
    ) {
        super();
        this.data = { scope: {} };
    }
    forEach(fn: (item: HTMLElement) => void): void {
        // TODO
    }
    // private _endPlaceholder = nativeApi.createComment();
    protected _onAppendChild(child: HTMLElement | Node): void {
        // TODO
        // nativeApi.insertBefore(child, this._endPlaceholder);
    }
    protected _onInit(initChanges: IBeforeInitChanges<T>) {
        super._onInit(initChanges);
        nativeApi.insertAfter(initChanges.fragment, this.placeholder);
        nativeApi.remove(this.placeholder);
        // nativeApi.insertAfter(this._endPlaceholder, this.placeholder);
        // nativeApi.insertBefore(initChanges.fragment, this._endPlaceholder);
    }
}
