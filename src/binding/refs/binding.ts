import { RemoveEventListenerFunction, nativeApi } from '../common/domapi';
import { INeBindingRef, INeTemplate, INeBindingScope, INeTemplateContext, INeElementBinding, INeBindingFunction, INeElement, noop, StateObject, StateChanges, INeTemplateCompileFunction, IBindingRefFactory, INeLogicElement, INeTemplateBindingHook, IInvokeDetectChangeFunction } from '../common/interfaces';
import { ObjectAccessor, isEmpty, requestFrame, merge, diffMerge, geometry } from 'neurons-utils';
import { IInjector } from 'neurons-injector';
import { NeContentElement } from '../elements/content';
import { IHTMLASTNode } from '../compiler/parser/template';
import { insertAfter } from 'neurons-dom';
import { GeometryRect } from 'neurons-utils/utils/geometryutils';
import { markChangeDetection, cancelChangeDetection } from './change';

class RootElements {
    constructor(private _elements: (HTMLElement | INeElement)[] = []) {}
    elements() {
        return this._elements.concat();
    }
    forEach(fn: (element: Node | HTMLElement | INeElement, index) => void): void {
        this._elements.forEach(fn);
    }
    find(fn: (element: Node) => boolean): Node {
        let result;
        for (let i = 0; i < this._elements.length; i++) {
            result = this._elements[i];
            if (result instanceof Node) {
                if (fn(result)) return result;
            } else {
                result = result.find(fn);
                if (result) return result;
            }
        }
        return null;
    }
    addElement(element): void {
        if (element instanceof DocumentFragment) {
            for (var i: number = 0; i < element.childNodes.length; i++) {
                this._elements.push(element.childNodes.item(i) as HTMLElement);
            }
        } else {
            this._elements.push(element);
        }
    }
    setAttribute(property: string, value: string) {
        this._elements.forEach(element => element.setAttribute(property, value));
    }
    setStyle(property: string, value: string) {
        this._elements.forEach(element => {
            if (element instanceof Node) {
                nativeApi.setStyle(element, property, value);
            } else {
                element.setStyle(property, value);
            }
        });
    }
    addClass(className: string) {
        this._elements.forEach(element => {
            if (element instanceof Node) {
                nativeApi.addClass(element, className);
            } else {
                element.addClass(className);
            }
        });
    }
    removeClass(className: string) {
        this._elements.forEach(element => {
            if (element instanceof Node) {
                nativeApi.removeClass(element, className);
            } else {
                element.removeClass(className);
            }
        });
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        const removes = [];
        this._elements.forEach(element => {
            if (element instanceof Node) {
                removes.push(nativeApi.addEventListener(element, eventName, handler));
            } else {
                removes.push(element.addEventListener(eventName, handler));
            }
        });
        return removes.length ? () => removes.forEach(fn => fn()) : noop;
    }
    getBoundingClientRect(): ClientRect {
        let result: GeometryRect;
        this._elements.forEach((element) => {
            let rect;
            if (element instanceof Node) {
                if (element.nodeType == 1) {
                    rect = element.getBoundingClientRect();
                }
            } else {
                rect = element.getBoundingClientRect();
            }
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
        } : { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, }
    }
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
export class NeBindingRef implements INeBindingRef {
    constructor(constructorStack: INeTemplateCompileFunction[], parent?: INeBindingRef, parentInjector?: IInjector, hooks?: INeTemplateBindingHook) {
        this._parent = parent;
        this._initializeStack = [];
        this._destroyStack = [];
        this._listeners = [];
        this._bindings = [];
        this._templateVaribles = {};
        this._customElements = [];
        this._logicElements = [];
        
        this.inited = false;
        this.destroyed = false;
        this.attached = false;
        this.isPlainTemplate = true;
        
        const rootElements = [];
        this._rootElements = new RootElements(rootElements);

        hooks = hooks || {};

        if (constructorStack && constructorStack.length) {
            const bindingRef = this;
            const context: INeTemplateContext = {
                rootElements: rootElements,
                customElements: this._customElements,
                logicElements: this._logicElements,
                parent: null,
                current: null,
                host: null,

                initializeStack: this._initializeStack,
                destroyStack: this._destroyStack,

                templateVaribles: this._templateVaribles,
                listeners: this._listeners,
                bindings: this._bindings,
                parentInjector: parentInjector,
                bindingRef: bindingRef,
                // hooks
                markChangeDetection: hooks.markChangeDetection || (() => {
                    return markChangeDetection(bindingRef);
                })
            }
            // 构造元素节点树，并形成初始函数栈、销毁函数栈及绑定函数栈，同时填充模板中非绑定的内容部分。
            constructorStack.forEach(func => {
                func(context);
            });
            this._bindings = this._bindings.filter(b => !!Object.keys(b.bindings).length);
            this.isPlainTemplate = !this._listeners.length && !this._bindings.length;
        }
    }
    inited: boolean;
    destroyed: boolean;
    attached: boolean;
    isPlainTemplate: boolean;

    protected _parent: INeBindingRef;
    private _context: any;
    private _implicits: any[] = [];
    private _scope: INeBindingScope = {};
    protected _pendingChanges: any = {};

    private _rootElements: RootElements;
    private _customElements: INeElement[];
    private _logicElements: INeLogicElement[];
    private _templateVaribles: { [id: string]: HTMLElement | Node | INeElement };
    private _initializeStack: INeBindingFunction[];
    private _destroyStack: INeBindingFunction[];
    private _listeners: RemoveEventListenerFunction[];
    private _bindings: INeElementBinding[];

    private _resizeListening: RemoveEventListenerFunction;
    protected _placeholder: Node;
    protected _parentNode: Node;
    private _childrens: HTMLElement[];
    private _freezeDetectChange = false;
    private _detectLoopCount = 0;

    bind(context: any, implicits?: any[]): void {
        if (this.destroyed || this.inited) return;
        this._context = context || {};
        this._implicits = implicits || [];
        this._updateScope(this._context, this._getImplicits());
        this._initialize();
    }
    implicits(data?: any[]): void {
        if (this.destroyed) return;
        this._implicits = data || [];
        this._updateScope(this._context, this._getImplicits());
    }
    instance(): any {
        return this._context;
    }
    /**
     * 设置状态变化。
     * 状态变化会引起变更检测，以更新绑定并执行onChange钩子函数。
     * @param newState
     */
    setState(newState: StateObject, recursiveDetecting: boolean = false): void {
        if (this.destroyed) return;
        // 如果尚未绑定上下文对象则直接返回
        if (!this._context) return;
        if (!this.attached) {
            Object.assign(this._pendingChanges, newState || {});
        } else {
            const stateChanges = this._applyStateChanges(newState);
            stateChanges && this._invokeLifeCircleHook('onChanges', stateChanges);
            (recursiveDetecting || stateChanges) && this._detectChanges(recursiveDetecting);
        }
    }
    resize(): void {
        if (!this.inited || this.destroyed) return;
        if (this._invokeLifeCircleHook('onResize')) {
            this._detectChanges();
        }
        this._customElements.forEach(element => {
            element.resize();
        });
    }
    appendTo(parent: Node) {
        if (this.destroyed) return;
        if (this._parentNode !== parent || !this.attached) {
            this._parentNode = parent;
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
                if (this._parentNode) {
                    this._detach();
                    this._parentNode = null;
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
        cancelChangeDetection(this);
        this._resizeListening && this._resizeListening();
        this._listeners.forEach(fn => fn());
        const scope = this._scope;
        this._destroyStack.forEach(func => {
            func(scope);
        });
        this._detach();
        this.destroyed = true;
        this._invokeLifeCircleHook('onDestroy');
    }
    detectChanges(recursive: boolean = false) {
        this._detectChanges(recursive);
    }
    elements() {
        return this._rootElements.elements();
    }
    find(fn: (element: Node) => boolean): Node {
        return this._rootElements.find(fn);
    }
    children(): HTMLElement[] {
        let children = [];
        if (!this.destroyed) {
            this._rootElements.forEach((element) => {
                if (element instanceof Node) {
                    children.push(element);
                } else {
                    children = children.concat(element.children());
                }
            })
        }
        return children;
    }
    parent(): INeBindingRef {
        return this._parent;
    }
    getTemplateVarible(id: string): HTMLElement | Node | INeElement {
        if (!id) return null;
        return this._templateVaribles[id];
    }
    appendChild(newChild: Node) {
        if (this.destroyed) return;
        const contentElement = this._customElements.find(el => el instanceof NeContentElement);
        if (contentElement) {
            contentElement.appendChild(newChild);
        } else {
            if (this._placeholder) {
                let lastOne;
                this._rootElements.find(element => { lastOne = element; return false});
                lastOne = lastOne || this._placeholder;
                insertAfter(newChild, lastOne);
            } else if (this._parentNode){
                this._parentNode.appendChild(newChild);
            }
            this._rootElements.addElement(newChild);
        }
    }
    insertTo(existNode: Node): void {
        this._rootElements.forEach(element => {
            if (element instanceof Node) {
                nativeApi.insertBefore(element, existNode);
            } else {
                element.insertTo(existNode);
            }
        });
    }
    setAttribute(property: string, value: string) {
        if (this.destroyed) return;
        this._rootElements.setAttribute(property, value);
    }
    setStyle(property: string, value: string) {
        if (this.destroyed) return;
        this._rootElements.setStyle(property, value);
    }
    addClass(className: string) {
        if (this.destroyed) return;
        this._rootElements.addClass(className);
    }
    removeClass(className: string) {
        if (this.destroyed) return;
        this._rootElements.removeClass(className);
    }
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        if (this.destroyed) return noop;
        return this._rootElements.addEventListener(eventName, handler);
    }
    getBoundingClientRect(): ClientRect {
        if (this.destroyed) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, };
        return this._rootElements.getBoundingClientRect();
    }
    protected _initialize() {
        if (this.inited || this.destroyed) return null;
        if (!this._placeholder && !this._parentNode) return;
        if (!!this._context) {
            const context = this._context;
            const implicits = this._implicits;
            // 处理逻辑组件
            this._logicElements.forEach(element => {
                element.bind(context, implicits);
            });
            const scope = this._scope;
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
            // calculateInitializeStates(this._bindings, scope);
            // 4. 标记初始化完成
            this.inited = true;
            this._freezeDetectChange = true;
            let needDetectChange = false;
            this._invokeLifeCircleHook('onInit') && (needDetectChange = true);
            this._invokeLifeCircleHook('onAttach') && (needDetectChange = true);
            // 按需注册resize
            this._registerGlobalEvents();
            this._freezeDetectChange = false;
            // 检测初始化前的变更
            const dirtyState = this._pendingChanges;
            this._pendingChanges = {};
            const stateChanges = this._applyStateChanges(dirtyState);
            // 初始化完成时，回调一次onChanges hook
            this._invokeLifeCircleHook('onChanges', stateChanges) && (needDetectChange = true);
            this._detectChanges();
        }
    }
    protected _invokeLifeCircleHook(hookName: string, arg?) {
        const context = this._context;
        if (context && hookName in context && typeof context[hookName] === 'function') {
            if (arg) {
                context[hookName](arg);
            } else {
                context[hookName]();
            }
            return true;
        } else {
            return false;
        }
    }
    protected _registerGlobalEvents() {
        const context = this._context;
        if (context && 'onResize' in context && typeof context['onResize'] === 'function') {
            this._resizeListening = nativeApi.onResize(() => {
                if (this.destroyed) return;
                const invokeDetectChange = this._markChangeDetection();
                this._invokeLifeCircleHook('onResize');
                invokeDetectChange();
            })
        }
    }
    private _markChangeDetection(): IInvokeDetectChangeFunction {
        return markChangeDetection(this);
    }
    protected _applyStateChanges(newState: StateObject): StateChanges {
        if (newState && !isEmpty(newState)) {
            const changes: StateChanges = {};
            Object.keys(newState).forEach(property => {
                if (this._context[property] !== newState[property]) {
                    const oldValue = this._context[property];
                    this._context[property] = newState[property];
                    changes[property] = { oldValue: oldValue, newValue: newState[property] }
                }
            });
            return isEmpty(changes) ? null : changes;
        }
        return null;
    }
    protected _detectChanges(recursive: boolean = false): void {
        const scope = this._scope;
        this._logicElements.forEach(element => element.implicits(this._getImplicits()));
        this._bindings.forEach(item => {
            const bindings = item.bindings;
            // TODO 优化计算
            Object.keys(bindings).forEach(targetKey => {
                bindings[targetKey].setter(scope);
            });
        });
        this._customElements.forEach(element => element.detectChanges(recursive));
    }
    protected _firstAttach() {
        if (this._placeholder) {
            // let firstChild;
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    nativeApi.insertBefore(element, this._placeholder);
                    // firstChild = element;
                } else {
                    element.insertTo(this._placeholder);
                    // firstChild = element.placeholder;
                }
            });
            // firstChild && nativeApi.insertBefore(this._placeholder, firstChild);
        } else {
            this._rootElements.forEach(element => {
                if (element instanceof Node) {
                    nativeApi.appendChild(this._parentNode, element);
                } else {
                    nativeApi.appendChild(this._parentNode, element.placeholder);
                }
            });
        }
        this.attached = true;
    }
    protected _attach() {
        if ((this._placeholder || this._parentNode) && !this.attached) {
            const customElements = [];
            if (this._placeholder) {
                // let firstChild;
                this._rootElements.forEach(element => {
                    if (element instanceof Node) {
                        nativeApi.insertBefore(element, this._placeholder);
                        // firstChild = element;
                    } else {
                        element.insertTo(this._placeholder);
                        customElements.push(element);
                        // firstChild = element.placeholder;
                    }
                });
                // firstChild && nativeApi.insertBefore(this._placeholder, firstChild);
            } else {
                this._rootElements.forEach(element => {
                    if (element instanceof Node) {
                        nativeApi.appendChild(this._parentNode, element);
                    } else {
                        nativeApi.appendChild(this._parentNode, element.placeholder);
                        customElements.push(element);
                    }
                });
            }
            customElements.forEach(customElement => {
                customElement.attach();
            });
            this.attached = true;
            let needDetectChange = false;
            this._invokeLifeCircleHook('onAttach') && (needDetectChange = true);
            // 检测detach后发生的变更
            const dirtyState = this._pendingChanges;
            this._pendingChanges = {};
            const stateChanges = this._applyStateChanges(dirtyState);
            if (stateChanges) {
                this._invokeLifeCircleHook('onChanges', stateChanges) && (needDetectChange = true);
            }
            (stateChanges || needDetectChange) && this._detectChanges();
        }
    }
    protected _detach() {
        if ((this._placeholder || this._parentNode) && this.attached) {
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
    private _updateScope(context: any, implicits?: any[]): void {
        this._scope.context = context;
        delete this._scope.implicits;
        if (implicits && implicits.length) {
            this._scope.implicits = {}
            implicits.forEach(object => {
                object && Object.assign(this._scope.implicits, object);
            });
        }
    }
    private _getImplicits() {
        return (this._implicits || []).concat([this._templateVaribles || {}])
    }
}

// 执行绑定，但处理life circle hook
export class NeImplicitsBindingRef extends NeBindingRef {
    protected _invokeLifeCircleHook(hookName: string, arg?) {
        return false;
    }
    protected _registerGlobalEvents() {
        // 不处理resize
    }
}

export class NeAttributeBindingRef extends NeBindingRef {
    constructor(
        constructorStack: INeTemplateCompileFunction[],
        hostElement: HTMLElement,
        parent?: INeBindingRef,
        parentInjector?: IInjector,
        hooks?: INeTemplateBindingHook
    ) {
        super(constructorStack, parent, parentInjector, hooks);
        this.attached = true;
        this._parentNode = hostElement;
    }
    protected _parentNode: HTMLElement;
    appendTo(parent: Node) {
        if (this.destroyed) return;
        this.attach();
    }
    attachTo(placeholder: Node) {
        if (this.destroyed) return;
        this.attach();
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
    appendChild(content: Node) {
        if (this.destroyed) return;
        this._parentNode.appendChild(content);
    }
    insertTo(existNode: Node): void {
        if (this.destroyed) return;
        this.attach();
    }
    protected _firstAttach() {
        this.attached = true;
    }
    protected _attach() {
        if (!this.attached) {
            this.attached = true;
            let needDetectChange = false;
            this._invokeLifeCircleHook('onAttach') && (needDetectChange = true);
            // 检测detach后发生的变更
            const dirtyState = this._pendingChanges;
            this._pendingChanges = {};
            const stateChanges = this._applyStateChanges(dirtyState);
            if (stateChanges) {
                this._invokeLifeCircleHook('onChanges', stateChanges) && (needDetectChange = true);
            }
            (stateChanges || needDetectChange) && this._detectChanges();
        }
    }
    protected _detach() {
        if (this.attached) {
            this.attached = false;
            this._invokeLifeCircleHook('onDetach');
        }
    }
}