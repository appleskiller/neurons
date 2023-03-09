import { emitter, EventEmitter, IEmitter } from "neurons-emitter";
import { isArray, ObjectAccessor } from "neurons-utils";
import { IJSEDataChanges, IJSEFormControl } from "./interfaces";


export class JSEFormControl implements IJSEFormControl {

    private _nativeEmitter: EventEmitter = new EventEmitter();

    onDataRefresh: IEmitter<IJSEDataChanges> = emitter('data_refresh', this._nativeEmitter);
    onDataChange: IEmitter<IJSEDataChanges> = emitter('data_change', this._nativeEmitter);

    private _object;
    private _objectAccessor: ObjectAccessor = new ObjectAccessor(null);

    get object(): any {
        return this._object;
    }

    refresh(pointer?: string): void {
        // 清理访问器缓存
        this._objectAccessor.cleanCache(pointer);
        if (pointer) {
            let value = this._objectAccessor.get(pointer);
            value = value === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : value;
            this.onDataRefresh.emit({
                type: 'refresh',
                pointer: pointer,
                oldValue: value,
                newValue: value,
            });
        } else {
            this.onDataRefresh.emit({
                type: 'refresh',
                pointer: undefined,
                oldValue: undefined,
                newValue: undefined,
            });
        }
    }

    reset(object: any): void {
        this._object = object;
        this._objectAccessor = new ObjectAccessor(this._object);
    }

    notify(pointer?: string) {
        if (pointer) {
            let value = this._objectAccessor.get(pointer);
            value = value === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : value;
            this.onDataChange.emit({
                type: 'change',
                pointer: pointer,
                oldValue: value,
                newValue: value,
            });
        } else {
            this.onDataChange.emit({
                type: 'change',
                pointer: undefined,
                oldValue: undefined,
                newValue: undefined,
            });
        }
    }

    getValue(pointer: string): any {
        if (!pointer) return this
        const value = this._objectAccessor.get(pointer);
        return value === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : value;
    }
    setValue(pointer: string, value: any, silent: boolean = false): void {
        if (!pointer) return;
        let oldValue = this._objectAccessor.get(pointer);
        oldValue = oldValue === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : oldValue;
        if (oldValue !== value) {
            this._objectAccessor.set(pointer, value);
            !silent && this.onDataChange.emit({
                type: 'change',
                pointer: pointer,
                oldValue: oldValue,
                newValue: value,
            });
        }
    }

    // for array items
    addValue(pointer: string, value: any, silent: boolean = false) {
        if (!pointer) return;
        let oldValue = this._objectAccessor.get(pointer);
        oldValue = oldValue === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : oldValue;
        this._objectAccessor.set(pointer, value);
        !silent && this.onDataChange.emit({
            type: 'add',
            pointer: pointer,
            oldValue: oldValue,
            newValue: value,
        });
    }
    // delete property
    deleteValue(pointer: string, silent: boolean = false) {
        if (!pointer) return;
        let oldValue = this._objectAccessor.get(pointer);
        oldValue = oldValue === ObjectAccessor.INVALID_PROPERTY_ACCESS ? undefined : oldValue;
        this._objectAccessor.del(pointer);
        !silent && this.onDataChange.emit({
            type: 'delete',
            pointer: pointer,
            oldValue: oldValue,
            newValue: undefined,
        });
    }

    destroy(): void {
        this._nativeEmitter.off();
    }
}
