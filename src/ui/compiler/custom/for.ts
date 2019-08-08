import { CustomElement, ICustomElementContext, IBeforeInitChanges } from './element';
import { IBindingScope, IBindingRef, BindingRefFactory, IElementData } from '../common/interfaces';
import { nativeApi } from '../common/domapi';
import { isArray } from '../../../utils';

export interface IForElementData<T> extends IElementData<T>{
    object: any[];
}

/**
 * for元素是一个特殊的元素。
 * 在处理模板绑定时为循环节点创建了独立的模板绑定作用域，这个作用域会在局部与原模板的作用域产生隔离。
 * 因绑定数据源来自于上级作用域，对于输入输出的绑定，系统会将上级作用域的源数据及变量传递到隔离的子级作用域，以保证提供正确的绑定数据。
 * 而对于变更监测函数，一旦for元素自身管理的任何一个子集作用域发生变更监测，都会对全部重复元素执行变更监测
 * @author AK
 * @template T 
 */
export class ForElement<T> extends CustomElement<T> {
    constructor(
        private bindingFactory: BindingRefFactory<T>,
        private identifier: string,
        private itemName: string,
        private indexName: string
    ) {
        super();
    }
    protected data: IForElementData<T>;

    private _refs: IBindingRef<T>[] = [];
    private _items: IBindingScope<any>[] = [];
    private _array: any[] = [];
    private _endPlaceholder = nativeApi.createComment();
    bind(data: IForElementData<T>): void {
        super.bind(data);
    }
    detectChanges() {
        super.detectChanges();
        // 更新注入
        this._refs.forEach((ref, index) => {
            const childScope = this._items[index];
            if (this.itemName) {
                childScope.implicits[this.itemName] = this._array[index];
            }
            if (this.indexName) {
                childScope.implicits[this.indexName] = index;
            }
            ref.implicits(childScope.implicits);
        });
    }
    forEach(fn: (item: HTMLElement) => void): void {
        this._refs.forEach(ref => {
            ref.forEach(fn);
        });
    }
    protected _onInit(initChanges: IBeforeInitChanges<T>) {
        super._onInit(initChanges);
        nativeApi.insertAfter(this._endPlaceholder, this.placeholder);
        this._refresh(this.data.scope, this.data.object);
    }
    protected _onUpdate() {
        super._onUpdate();
        this._refresh(this.data.scope, this.data.object);
    }
    protected _onAttach() {
        super._onAttach();
        const fragment = nativeApi.createDocumentFragment();
        this._refs.forEach(ref => {
            ref.appendTo(fragment);
        });
        nativeApi.insertAfter(fragment, this.placeholder);
    }
    protected _onDetach() {
        super._onDetach();
        this._refs.forEach(ref => {
            ref.detach();
        });
    }
    protected _onResize() {
        super._onDetach();
        this._refs.forEach(ref => {
            ref.resize();
        });
    }
    protected _onDestroy() {
        super._onDestroy();
        this._refs.forEach(ref => ref.destroy());
        nativeApi.remove(this._endPlaceholder);
    }
    private _refresh(scope: IBindingScope<T>, object: any) {
        this._array = object || [];
        this._array = isArray(object) ? object : [object];
        const newRefs = [];
        const newItems = [];
        const fragment = nativeApi.createDocumentFragment();
        for (let i = 0; i < this._array.length; i++) {
            const item = this._array[i];
            const childScope = { ...scope };
            childScope.implicits = { ...(scope.implicits || {}) };
            if (this.itemName) {
                childScope.implicits[this.itemName] = item;
            }
            if (this.indexName) {
                childScope.implicits[this.indexName] = i;
            }
            const ref = this._recycleRef(i, childScope, fragment);
            newRefs.push(ref);
            newItems.push(childScope);
        }
        for (let i = this._array.length; i < this._refs.length; i++) {
            this._refs[i].destroy();
        }
        this._refs = newRefs;
        this._items = newItems;
        // 处理新增元素
        nativeApi.insertBefore(fragment, this._endPlaceholder);
    }
    private _recycleRef(index: number, scope: IBindingScope<T>, parent: Node) {
        let ref = this._refs[index];
        // TODO 此处需要进一步处理，因为当前scope是父级作用域，带有全部的属性信息
        // 而ref在执行bind的时候会进行diffMerge这是一次很严重的资源浪费
        if (!ref) {
            ref = this.bindingFactory(() => this.detectChanges());
            ref.appendTo(parent);
            ref.bind(scope);
        } else {
            ref.assign(scope);
        }
        return ref;
    }
}
