import { INeElement, INeBindingScope, INeElementBinding, IBindingMetadata, EventName, INeBindingRef, ILogicBindingMetadata, IBindingRefFactory, noop, INeBindingFunction, INeLogicElement } from '../common/interfaces';
import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { cssProp2Prop, value2CssValue, parseToClassMap } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { isEmpty, geometry } from 'neurons-utils';
import { getUIBindingMetadata, getLogicBindingMetadata } from '../factory/binding';
import { NeBindingRef } from '../refs/binding';
import { buildinBindingProviders } from '../factory/injector';
import { IInjector } from 'neurons-injector';
import { INeElementChanges } from './element';
import { IStatementInfo } from '../compiler/parser/statement';
import { BuildInsVaribles } from '../common/enums';
import { GeometryRect } from 'neurons-utils/utils/geometryutils';
import { registerBindingElement, BindingElementTypes } from '../factory/element';

const takenItemPlaceholder = '__taken_array_item_placeholder__';

export class NeForElement implements INeLogicElement {
    constructor(
        logicSelector: string,
        // *xxx="statement"
        logicValue: IStatementInfo,
        // let-xxx="xxx"
        varibles: { [key: string]: INeBindingFunction },
        // binding ref
        bindingRefFactory: IBindingRefFactory
    ) {
        let statement = (logicValue.statement || '').trim();
        let itemName, indexName;
        if (statement.indexOf(' in ') !== -1) {
            let arr = statement.split(' in ');
            arr = arr[0].split(',');
            itemName = (arr[0] || '').trim();
            indexName = (arr[1] || '').trim();
        }
        this._itemName = itemName;
        this._indexName = indexName;
        this._implicitsVaribles = varibles;
        this._bindingRefFactory = bindingRefFactory;
    }

    placeholder: Node = nativeApi.createComment();
    attached = false;

    protected inited = false;
    protected destroyed = false;

    private _bindingRefFactory: IBindingRefFactory;
    private _refs: INeBindingRef[];
    private _array: any[] = [];
    private _oldArray: any[] = [];
    private _endPlaceholder = nativeApi.createComment();

    private _fragment = nativeApi.createDocumentFragment();
    private _itemName;
    private _indexName;
    private _implicitsVaribles: { [key: string]: INeBindingFunction };
    
    private _context: any;
    private _implicits: any[] = [];
    bind(context: any, implicits?: any[]): void {
        this._context = context;
        this._implicits = implicits;
    }
    implicits(datas: any[]): void {
        this._implicits = datas;
    }
    detectChanges(recursive: boolean = false) {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            this._applyChanges(recursive);
        }
    }
    find(fn: (element: Node) => boolean): Node {
        if (!this.inited) return fn(this.placeholder) ? this.placeholder : null;
        if (fn(this.placeholder)) return this.placeholder;
        const refs = this._refs || [];
        for (var i: number = 0; i < refs.length; i++) {
            const result = refs[i].find(fn);
            if (result) return result;
        }
        return fn(this._endPlaceholder) ? this._endPlaceholder : null;
    }
    attach(): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this.initialize();
        } else {
            if (this.placeholder.parentNode && !this.attached) {
                this.onAttach();
                this.attached = true;
            }
        }
    }
    detach(): void {
        if (!this.inited || this.destroyed) return;
        this.onDetach();
        this.attached = false;
    }
    passOnAttach(): void {
        if (this.destroyed) return;
        this._refs && this._refs.forEach(ref => {
            ref.passOnAttach();
        });
    }
    passOnDetach(): void {
        if (this.destroyed) return;
        this._refs && this._refs.forEach(ref => {
            ref.passOnDetach();
        });
    }
    resize() {
        if (!this.inited || this.destroyed) return;
        this.onResize();
    }
    appendChild<T extends Node>(newChild: T) {
        if (this.destroyed) return;
        // if (!this.inited) {
        //     this._fragment.appendChild(newChild);
        // } else {
        //     this._bindingRef.append(newChild);
        // }
        return newChild;
    }
    insertTo(existNode: Node): void {
        if (this.destroyed) return;
        if (!this.inited) {
            nativeApi.insertBefore(this.placeholder, existNode);
        } else {
            // this._bindingRef && this._bindingRef.insertTo(existNode);
            // TODO
        }
    }
    setAttribute(property: string, value: any) {
        if (this.destroyed) return;
        if (property === '*for') {
            this._array = value || [];
        }
    }
    setStyle(property: string, value: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.styles[property] = value;
    }
    addClass(className: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.classes[className] = true;
    }
    removeClass(className: string) {
        if (this.destroyed) return;
        // this._dirtyChanges.classes[className] = false;
    }
    remove() {
        if (this.destroyed) return;
        this.detach();
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        return noop;
    }
    getBoundingClientRect() {
        if (this.destroyed) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, };
        const refs = this._refs || [];
        let result: GeometryRect;
        refs.forEach((ref) => {
            const rect = ref.getBoundingClientRect();
            if (rect) {
                if (!result) {
                    result = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
                } else {
                    result = geometry.unionRect(result, { x: rect.left, y: rect.top, width: rect.width, height: rect.height })
                }
            }
        })
        return result ? {
            left: result.x,
            right: result.x + result.width,
            top: result.y,
            bottom: result.y + result.height,
            width: result.width,
            height: result.height,
        } : { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, };
    }
    children(): HTMLElement[] {
        let children = [];
        if (!this.destroyed) {
            (this._refs || []).forEach((ref) => {
                children = children.concat(ref.children());
            })
        }
        return children;
    }
    destroy() {
        if (this.destroyed) return;
        this.onDestroy();
        nativeApi.remove(this.placeholder);
        this.destroyed = true;
    }
    protected initialize() {
        if (this.inited || this.attached || this.destroyed) return;
        if (!this.placeholder.parentNode || !this._array) return;
        this.onInit();
        // 标记初始化完成
        this.inited = true;
        this.attached = true;
    }
    protected onInit() {
        // 插入占位标记
        nativeApi.insertAfter(this._endPlaceholder, this.placeholder);
        this._refs = [];
        const array = this._array || [];
        this._oldArray = array.concat();
        array.forEach((item, i) => {
            const ref = this._bindingRefFactory.newInstance();
            ref.attachTo(this._endPlaceholder)
            ref.bind(this._context, (this._implicits || []).concat([this._mergeItemImplicits({}, item, i, array)]));
            this._refs.push(ref);
        });
    }
    protected onAttach() {
        let last;
        this._refs && this._refs.forEach(ref => {
            last = last || this.placeholder;
            ref.attachTo(last)
            last = this._getLastChild(ref);
        });
    }
    protected onDetach() {
        this._refs && this._refs.forEach(ref => {
            ref.detach();
        });
    }
    protected onResize() {
        this._refs && this._refs.forEach(ref => {
            ref.resize();
        });
    }
    protected onDestroy() {
        this._refs && this._refs.forEach(ref => ref.destroy());
        nativeApi.remove(this._endPlaceholder);
    }
    private _removeRefFrom(refs: INeBindingRef[], ref: INeBindingRef) {
        const index = refs.indexOf(ref);
        if (index !== -1) {
            refs.splice(index, 1);
        }
    }
    private _applyChanges(recursive: boolean = false) {
        if (this.destroyed) return;
        const diffs = this._diffMembers(this._array, this._oldArray);
        if (diffs) {
            const array = this._array || [];
            const oldArray = (this._oldArray || []).concat();
            const refs = this._refs || [];
            this._refs = [];
            this._oldArray = array.concat();
            let ref: INeBindingRef;
            // 倒序移除
            for (var i: number = diffs.removes.length - 1; i >=0 ; i--) {
                ref = refs[diffs.removes[i]];
                ref && ref.destroy();
            }
            // 正序调整
            let item, oldIndex, placeholder, j;
            for (var i: number = 0; i < array.length; i++) {
                // 查找占位元素
                if (!placeholder && diffs.remains.length) {
                    placeholder = this._getFirstChild(refs[diffs.remains[0]])
                }
                item = array[i];
                oldIndex = oldArray.indexOf(item);
                if (oldIndex === -1) {
                    // 创建
                    ref = this._bindingRefFactory.newInstance();
                    ref.attachTo(placeholder || this._endPlaceholder);
                    ref.bind(this._context, (this._implicits || []).concat([this._mergeItemImplicits({}, item, i, array)]));
                } else {
                    // 使用takenItemPlaceholder占位，确保对于重复的项目能够正常创建
                    oldArray[oldIndex] = takenItemPlaceholder;
                    ref = refs[oldIndex];
                    if (diffs.remains.length && refs[diffs.remains[0]] === ref) {
                        // 当前位置刚好是即将调整位置的元素
                        ref.implicits((this._implicits || []).concat([this._mergeItemImplicits({}, item, i, array)]));
                        ref.detectChanges(recursive);
                        // placeholder置为空，以便下一轮进行重新查找
                        placeholder = null;
                    } else {
                        // 调整索引
                        ref.implicits((this._implicits || []).concat([this._mergeItemImplicits({}, item, i, array)]));
                        ref.insertTo(placeholder || this._endPlaceholder);
                        ref.detectChanges(recursive);
                    }
                    // 从remains中移除oldIndex
                    diffs.remains.splice(diffs.remains.indexOf(oldIndex), 1);
                }
                this._refs.push(ref);
            }
        } else {
            for (var i: number = 0; i < this._refs.length; i++) {
                this._refs[i].detectChanges(recursive);
            }
        }
    }
    private _diffMembers(array, oldArray): {remains: any[], removes: any[]} {
        array = (array || []).concat();
        oldArray = oldArray || [];
        const remains = [];
        const removes = [];
        let changed = array.length !== oldArray.length;
        for (var i: number = 0; i < oldArray.length; i++) {
            changed = changed || array[i] !== oldArray[i];
            const index = array.indexOf(oldArray[i]);
            if (index === -1) {
                removes.push(i);
            } else {
                // 使用takenItemPlaceholder占位，确保对于重复的项目能够正常创建
                array[index] = takenItemPlaceholder;
                remains.push(i);
            }
        }
        return changed ? {remains: remains, removes: removes} : null;
    }
    private _getLastChild(ref: INeBindingRef) {
        if (!ref) return this.placeholder;
        let last;
        ref.find(element => {
            last = element;
            return false;
        });
        return last;
    }
    private _getFirstChild(ref: INeBindingRef) {
        if (!ref) return this._endPlaceholder;
        const first = ref.find(element => true);
        return first || this._endPlaceholder;
    }
    private _mergeItemImplicits(implicits, item, index, array) {
        implicits[BuildInsVaribles.$item] = item;
        implicits[BuildInsVaribles.$index] = index;
        implicits[BuildInsVaribles.$length] = array.length;
        implicits[BuildInsVaribles.$array] = array;
        this._itemName && (implicits[this._itemName] = item);
        this._indexName && (implicits[this._indexName] = index);
        Object.keys(this._implicitsVaribles || {}).forEach(key => {
            const getter = this._implicitsVaribles[key];
            implicits[key] = getter({ context: this._context, implicits: implicits });
        });
        return implicits;
    }
}


registerBindingElement(BindingElementTypes.FOR, NeForElement);