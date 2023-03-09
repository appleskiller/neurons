import { emitter, EventEmitter, IEmitter } from "neurons-emitter";
import { IJSEDataControl } from "./interfaces";


export class JSEDataControl implements IJSEDataControl {

    static create(): IJSEDataControl {
        return new JSEDataControl();
    }

    private _nativeEmitter: EventEmitter = new EventEmitter();

    onRefresh: IEmitter<string> = emitter('data_refresh', this._nativeEmitter);

    refresh(pointer?: string) {
        this.onRefresh.emit(pointer);
    }

}
