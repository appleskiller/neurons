import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { ITemplateContext, TemplateContextFunction, IBindingRef, BindFunction, IBindingScope, StateChanges, StateObject, IUIState, IInputBindings, ICustomElement } from '../common/interfaces';
import { ObjectAccessor, isEmpty, requestFrame, merge, diffMerge } from '../../../utils';
import { attachTempalateElementProperty } from '../../factory/injector';
import { IInjector } from '../../../helper/injector';
import { unionRect, GeometryRect } from '../../../utils/geometryutils';

export function calculateInitializeStates<T>(bindings: IInputBindings<T>, scope: IBindingScope<T>) {
    const accessor = new ObjectAccessor(scope.context || {});
    const chains = bindings.chains;
    Object.values(chains).forEach(binding => {
        const value = accessor.get(binding.chainProp);
        if (value !== ObjectAccessor.INVALID_PROPERTY_ACCESS) {
            binding.previousValue = value;
        }
    });
}
export function syncStatesFromChanges<T>(bindings: IInputBindings<T>, changes: StateChanges) {
    const chains = bindings.chains || {};
    Object.keys(changes).forEach(prop => {
        const value = changes[prop].newValue;
        const binding = chains[prop];
        binding && (binding.previousValue = value);
    });
}
/**
 * 绑定执行过程
 * constructorStack -> 解析XMLASTNode, 收集模板信息，初始化简单元素及属性，为绑定处理确定元素目标
 * initializeStack -> 确定构造访问（getter or setting）函数和绑定（输入赋值或输出监听）函数，并执行初始绑定
 * inputBindings -> 使用属性链映射绑定函数集合，在后续监测中通过检查属性值变更决定重新调用哪些绑定函数
 * 
 * 绑定的变更监测
 * 1. 输入属性绑定：对于属性及链式属性绑定([prop]="varible")，将检测原始链式属性值的变化决定是否重新执行赋值操作。
 * 2. 带有函数调用的输入绑定：对于带有函数的输入绑定([prop]="func()")，因为模板编译程序无法获悉函数的内部内容，因此采用检查绑定目标值的方式处理，这将在变更监测时引起一次额外的计算。这个默认行为有可能产生副作用，取决于用户函数内部执行细节是否有副作用，因此对于带有取值函数的输入绑定，用户函数应实现为幂等的纯函数。
 * 3. 输出属性绑定：处理输出绑定时，如果绑定的函数变量本身发生的改变，则会执行重新绑定(移除上次的监听，建立新的监听)
 */
export class BindingRef<T> implements IBindingRef<T> {
    constructor(constructorStack: TemplateContextFunction<T>[], private _parentChangeDetector?: () => void, parentInjector?: IInjector) {
        this._initializeStack = [];
        this._updateStack = [];
        this._destroyStack = [];
        this._listeners = [];
        this._inputBindings = {
            chains: {},
            inputs: [],
        };
        this._isPlainTemplate = true;
        this._templateVaribles = {};
        this._rootElements = [];
        this._customElements = [];

        this.inited = false;
        this.destroyed = false;
        this.attached = false;
        if (constructorStack && constructorStack.length) {
            const context: ITemplateContext<T> = {
                rootElements: this._rootElements,
                customElements: this._customElements,
                parent: null,
                current: null,
    
                initializeStack: this._initializeStack,
                updateStack: this._updateStack,
                destroyStack: this._destroyStack,
    
                isPlainTemplate: true,
                templateVaribles: this._templateVaribles,
                listeners: this._listeners,
                inputBindings: this._inputBindings,
                parentInjector: parentInjector,
    
                detectChanges: () => (this._parentChangeDetector ? this._parentChangeDetector() : this.detectChanges())
            }
            // 构造元素节点树，并形成初始函数栈、更新函数栈、销毁函数栈及绑定函数栈，同时填充模板中非绑定的内容部分。
            constructorStack.forEach(func => {
                func(context);
            });
            // 如果不存在更新函数栈，则认为是无状态的简单元素
            this._isPlainTemplate = context.isPlainTemplate;
        }
        // 构造scope
        this._scope = {
            context: undefined,
            implicits: undefined
        }
    }
    inited: boolean;
    destroyed: boolean;
    attached: boolean;
    
    private _rootElements: (ICustomElement<T> | HTMLElement | Node)[];
    private _customElements: ICustomElement<T>[];
    private _scope: IBindingScope<T>
    private _templateVaribles: { [id: string]: HTMLElement | Node | ICustomElement<T>};
    private _isPlainTemplate: boolean;
    private _initializeStack: BindFunction<T>[];
    private _updateStack: BindFunction<T>[];
    private _destroyStack: BindFunction<T>[];
    private _listeners: RemoveEventListenerFunction[];
    private _inputBindings: IInputBindings<T>;

    private _resizeListening: RemoveEventListenerFunction;
    private _placeholder: Node;
    private _parent: Node;
    private _childrens: HTMLElement[];
    private _freezeDetectChange = false;
    private _detectLoopCount = 0;
    elements(): (HTMLElement | Node | ICustomElement<T>)[] {
        return this._rootElements || [];
    }
    getTemplateVarible(id: string): HTMLElement | Node | ICustomElement<T> {
        if (!id) return null;
        return this._templateVaribles[id];
    }
    getBoundingClientRect(): ClientRect {
        let result: GeometryRect;
        if (!this.destroyed) {
            this.forEach((element) => {
                if (element && element.nodeType == 1) {
                    const rect = element.getBoundingClientRect();
                    if (!result) {
                        result = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
                    } else {
                        result = unionRect(result, { x: rect.left, y: rect.top, width: rect.width, height: rect.height })
                    }
                }
            })
        }
        return result ? {
            left: result.x,
            right: result.x + result.width,
            top: result.y,
            bottom: result.y + result.height,
            width: result.width,
            height: result.height,
        } : {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            width: 0,
            height: 0,
        }
    }
    children(): HTMLElement[] {
        const children = [];
        if (!this.destroyed) {
            this.forEach((element) => {
                children.push(element);
            })
        }
        return children;
    }
    forEach(fn: (item: HTMLElement) => void): void{
        if (fn && !this.destroyed) {
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    if (element.nodeType === 1) {
                        fn(element as HTMLElement);
                    }
                } else {
                    (element as ICustomElement<any>).forEach(fn);
                }
            })
        }
    }
    findCustoms(fn: (item: ICustomElement<T>) => boolean): ICustomElement<T> {
        if (fn && !this.destroyed) {
            return this._customElements.find(element => fn(element));
        } else {
            return null;
        }
    }
    firstChild(): Node {
        let firstChild;
        for (let i = 0; i < this._rootElements.length; i++) {
            if (this._rootElements[i] instanceof Node) {
                firstChild = this._rootElements[i] as Node;
            } else {
                firstChild = (this._rootElements[i] as ICustomElement<T>).firstChild();
            }
            if (firstChild) return firstChild;
        }
    }
    bind(scope?: IBindingScope<T>): void {
        if (this.destroyed) return;
        scope = scope || {} as any;
        let changed = {};
        if (!this._scope.context) {
            this._scope.context = scope.context;
            if (this.inited && this._scope.context) {
                Object.keys(this._scope.context).forEach(key => {
                    changed[key] = {oldValue: undefined, newValue: this._scope.context[key]};
                });
            }
        } else {
            if (this.inited) {
                changed = diffMerge(this._scope.context, scope.context || {});
            } else {
                merge(true, this._scope.context, scope.context || {});
            }
        }
        if (!this._scope.implicits) {
            this._scope.implicits = scope.implicits;
        } else {
            Object.assign(this._scope.implicits, scope.implicits || {});
        }
        if (!this.inited) {
            this._initialize();
        } else {
            if (!isEmpty(changed)) {
                // 同步变更的属性，避免接下来的detectChange引起再次回调onChanges
                syncStatesFromChanges(this._inputBindings, changed);
                this._invokeLifeCircleHook('onChanges', changed);
            }
        }
    }
    // TODO 为*for临时开放的接口，用于处理重复子节点的绑定
    assign(scope: IBindingScope<T>): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this.bind(scope);
            return;
        } else {
            scope = scope || {} as any;
            Object.assign(this._scope.context, scope.context || {});
            Object.assign(this._scope.implicits, scope.implicits || {});
            // this.detectChanges();
        }
    }
    implicits(object?: {[key: string]: any}): void {
        if (!this._scope.implicits) {
            this._scope.implicits = object;
        } else {
            Object.assign(this._scope.implicits, object || {});
        }
        if (!this.inited) {
            this._initialize();
        } else {
            this.detectChanges();
        }
    }
    resize(): void {
        if (!this.inited || this.destroyed) return;
        this._invokeLifeCircleHook('onResize');
        this._customElements.forEach(element => {
            element.resize();
        });
    }
    appendTo(parent: Node) {
        if (this.destroyed) return;
        if (this._parent !== parent || !this.attached) {
            this._parent = parent;
            if (!this.inited) {
                this._initialize();
            } else {
                if (this._placeholder) {
                    this._detach();
                    this._placeholder = null;
                }
                this._attach();
            }
        }
    }
    attachTo(placeholder: Node) {
        if (this.destroyed) return;
        if (this._placeholder !== placeholder || !this.attached) {
            this._placeholder = placeholder;
            if (!this.inited) {
                this._initialize();
            } else {
                if (this._parent) {
                    this._detach();
                    this._parent = null;
                }
                this._attach();
            }
        }
    }
    attach(): void {
        if (this.destroyed) return;
        if (!this.inited) {
            this._initialize();
        } else {
            this._attach();
        }
    }
    detach(): void {
        if (!this.inited || this.destroyed) return;
        this._detach();
    }
    destroy(): void {
        if (this.destroyed) return;
        // 移除事件绑定
        this._resizeListening && this._resizeListening();
        this._listeners.forEach(fn => fn());
        const scope = this._composeScope();
        this._destroyStack.forEach(func => {
            func(scope);
        });
        this._detach();
        this.destroyed = true;
        this._invokeLifeCircleHook('onDestroy');
    }
    detectChanges() {
        if (this._detectLoopCount > 1) {
            this._detectLoopCount = 0;
            return;
        }
        if (!this.inited || this.destroyed) return;
        if (this._freezeDetectChange) return;
        const scope = this._composeScope();
        let changed = false;
        const changes = {} as StateChanges;
        // 链式属性绑定检测
        const chains = this._inputBindings.chains;
        const inputFuncs = this._inputBindings.inputs;
        const outputFuncs = [];
        if (!isEmpty(chains)) {
            const implicitsAccessor = (scope.implicits && !isEmpty(scope.implicits)) ? new ObjectAccessor(scope.implicits) : null;
            const accessor = (scope.context && !isEmpty(scope.context)) ? new ObjectAccessor(scope.context) : null;
            if (accessor || implicitsAccessor) {
                Object.values(chains).forEach(chainInfo => {
                    // 计算自身属性变更
                    let value = accessor ? accessor.get(chainInfo.chainProp) : ObjectAccessor.INVALID_PROPERTY_ACCESS;
                    if (value === ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                        value = implicitsAccessor ? implicitsAccessor.get(chainInfo.chainProp) : ObjectAccessor.INVALID_PROPERTY_ACCESS;
                    }
                    if (value !== ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                        if (chainInfo.previousValue !== value) {
                            changed = true;
                            changes[chainInfo.chainProp] = { oldValue: chainInfo.previousValue, newValue: value };
                            chainInfo.previousValue = value;
                            chainInfo.outputs.forEach(b => {
                                if (b.binding && outputFuncs.indexOf(b.binding) === -1) {
                                    outputFuncs.push(b.binding);
                                }
                            })
                        }
                    }
                });
            }
        }
        // 更新输入绑定
        inputFuncs.forEach(fn => fn(scope));
        // 更新输出绑定（重新监听）
        outputFuncs.forEach(fn => fn(scope));
        this._customElements.forEach(element => {
            element.detectChanges();
        });
        if (changed) {
            this._detectLoopCount += 1;
            this._invokeLifeCircleHook('onChanges', changes);
            this._detectLoopCount = 0;
        }
    }
    private _initialize() {
        if (this.inited || this.destroyed) return null;
        if (!this._placeholder && !this._parent) return;
        const scope = this._composeScope();
        if (this._isPlainTemplate || !!scope.context || !!scope.implicits) {
            const state = this._scope.context;
            // 1. 插入文档
            this._firstAttach();
            this._customElements.forEach(customElement => {
                customElement.attach();
            });
            // 2. 执行初始绑定
            this._initializeStack.forEach(func => {
                func(scope);
            });
            // 3. 计算初始状态
            calculateInitializeStates(this._inputBindings, scope);
            // 4. 标记初始化完成
            this.inited = true;
            this._freezeDetectChange = true;
            this._invokeLifeCircleHook('onInit');
            this._invokeLifeCircleHook('onAttach');
            // 按需注册resize
            if (state && 'onResize' in state && typeof state['onResize'] === 'function') {
                this._resizeListening = nativeApi.onResize(() => {
                    if (this.destroyed) return;
                    this._invokeLifeCircleHook('onResize');
                })
            }
            this._freezeDetectChange = false;
            // 初始化完成时，回调一次onChanges hook，但不会带有变更信息，这可以用于判断是否是第一次的变更
            this._invokeLifeCircleHook('onChanges', null);
        }
    }
    private _firstAttach() {
        if (this._placeholder) {
            let previous = this._placeholder;
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    nativeApi.insertAfter(element, previous);
                    previous = element;
                } else {
                    nativeApi.insertAfter(element.placeholder, previous);
                    previous = element.placeholder;
                }
            });
        } else {
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    nativeApi.appendChild(this._parent, element);
                } else {
                    nativeApi.appendChild(this._parent, element.placeholder);
                }
            });
        }
        this.attached = true;
    }
    private _attach() {
        if ((this._placeholder || this._parent) && !this.attached) {
            const customElements = [];
            if (this._placeholder) {
                let previous = this._placeholder;
                this._rootElements.forEach(element => {
                    if (element instanceof Node) {
                        nativeApi.insertAfter(element, previous);
                        previous = element;
                    } else {
                        nativeApi.insertAfter(element.placeholder, previous);
                        customElements.push(element);
                        previous = element.placeholder;
                    }
                });
            } else {
                this._rootElements.forEach(element => {
                    if (element instanceof Node) {
                        nativeApi.appendChild(this._parent, element);
                    } else {
                        nativeApi.appendChild(this._parent, element.placeholder);
                        customElements.push(element);
                    }
                });
            }
            customElements.forEach(customElement => {
                customElement.attach();
            });
            this.attached = true;
            this._invokeLifeCircleHook('onAttach');
        }
    }
    private _detach() {
        if ((this._placeholder || this._parent) && this.attached) {
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    nativeApi.remove(element);
                } else {
                    element.detach();
                }
            });
            this.attached = false;
            this._invokeLifeCircleHook('onDetach');
        }
    }
    private _composeScope(): IBindingScope<T> {
        const scope: IBindingScope<T> = {};
        this._scope.context && (scope.context = this._scope.context);
        if ((this._scope.implicits && !isEmpty(this._scope.implicits)) || (this._templateVaribles && !isEmpty(this._templateVaribles))) {
            scope.implicits = {
                ...(this._scope.implicits || {}),
                ...(this._templateVaribles || {}),
            }
        }
        return scope;
    }
    private _invokeLifeCircleHook(hookName: string, arg?) {
        // TODO 针对for的特殊处理
        if (this['isSubBindingRef']) {
            return;
        }
        const state = this._scope.context;
        if (state && hookName in state && typeof state[hookName] === 'function') {
            if (arg) {
                state[hookName](arg);
            } else {
                state[hookName]();
            }
        }
        if (hookName !== 'onDestroy' && hookName !== 'onDetach') {
            if (this._parentChangeDetector) {
                this._parentChangeDetector();
            } else {
                this.detectChanges();
            }
        }
    }
}