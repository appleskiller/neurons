import { RemoveEventListenerFunction } from './domapi';
import { IInjector, ClassLike, Provider } from 'neurons-injector';

// --------------------------------------------------
export type StateObject = { [key: string]: any };
export type StateChanges = {
    [property: string]: {
        oldValue: any;
        newValue: any;
    }
}

export interface IUIState extends StateObject {
    injector?: IInjector;
}
export interface IUIStateStatic<T extends IUIState> {
    new(): T
}

export interface IStateInitHook {
    onInit(): void;
}
export interface IStateChangeHook {
    onChanges(changes?: StateChanges): void;
}
export interface IStateDestroyHook {
    onDestroy(): void;
}
export interface IStateAttachHook {
    onAttach(): void;
}
export interface IStateDetachHook {
    onDetach(): void;
}
export interface IStateResizeHook {
    onResize(): void;
}

export type InjectToken = any;
export type PropertyName = string;
export type EventName = string;
export type BindingSelector = string;
export type BindingTemplate = string;
export type BindingStatement = string;
export type LogicBindingSelector = string;
export type AttributeBindingSelector = string;
export type TemplateId = string;
/**
 * binding definition {'key': value}
 * - 'key': value 常规赋值。仅执行一次的赋值操作，value为实际值而非求值语句
 * - '[key]': statement 属性绑定。形成指定属性的赋值绑定关系
 * - '(key)': statement 事件绑定。key为IEmitter类型的事件输出
 * @author AK
 */
export interface IBindingDefinition {
    [attr: string]: BindingStatement;
}
export interface IUIBindingDecoratorOption {
    template: BindingTemplate;
    style?: string;

    requirements?: ClassLike[];

    properties?: { [aliasName: string]: PropertyName };
    emitters?: { [propertyName: string]: EventName };
    injects?: { [propertyName: string]: InjectToken };
    elements?: { [propertyName: string]: TemplateId };
}

export interface IBindingMetadata extends IUIBindingDecoratorOption {
    Clazz?: ClassLike;
}

export interface IUIBindingDefinition extends IUIBindingDecoratorOption {
    selector: BindingSelector;
}

export interface IAttributeBindingDecoratorOption {
    hostBinding?: IBindingDefinition;
    
    requirements?: ClassLike[];
    properties?: { [aliasName: string]: PropertyName };
    emitters?: { [propertyName: string]: EventName };
    injects?: { [propertyName: string]: InjectToken };
    elements?: { [propertyName: string]: TemplateId };
}
export interface IAttributeBindingMetadata extends IAttributeBindingDecoratorOption {
    Clazz?: ClassLike;
}
export interface IAttributeBindingDefinition extends IAttributeBindingDecoratorOption {
    selector: AttributeBindingSelector;
}

export interface ILogicBindingDecoratorOption {
    requirements?: ClassLike[];
    properties?: { [aliasName: string]: PropertyName };
}
export interface ILogicBindingMetadata extends ILogicBindingDecoratorOption {
    Clazz?: ClassLike;
}
export interface ILogicBindingDefinition extends ILogicBindingDecoratorOption {
    selector: LogicBindingSelector;
}

export interface INeBindingScope {
    context?: any;
    implicits?: { [key: string]: any };
}
export type INeProcessingFunction = (scope: INeBindingScope) => void;

export interface INeElement {
    readonly placeholder: Node;
    readonly attached: boolean;

    getTemplateVarible(id: string): HTMLElement | Node | INeElement;
    find(fn: (element: Node) => boolean): Node;
    children(): HTMLElement[];

    attach(): void;
    detach(): void;
    passOnAttach(): void;
    passOnDetach(): void;
    resize();
    detectChanges(recursive?: boolean): void;
    destroy();
    
    appendChild<T extends Node>(newChild: T): T;
    insertTo(existNode: Node): void;
    setAttribute(property: string, value: string);
    setStyle(property: string, value: string);
    addClass(className: string);
    removeClass(className: string);
    remove();
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction;
    getBoundingClientRect(): ClientRect;
}

export interface INeAttributeElement extends INeElement {

}

export interface INeLogicElement {
    bind(context: any, implicits?: any[]): void;
    implicits(datas: any[]): void;
}

export type INeTemplateCompileFunction = (context: INeTemplateContext) => void;
export type INeBindingFunction = (scope: INeBindingScope) => any;

export interface INeElementBinding {
    element: HTMLElement | INeElement;
    bindings: {
        [targetKey: string]: {
            isPlainBinding: boolean;
            sourceKeys: string[];
            setter: INeBindingFunction;
            // 某些情况无法获得单一值的getter，如class和style的动态key绑定，此时getter为undefined
            getter?: INeBindingFunction;
        }
    },
}


export type IInvokeDetectChangeFunction = () => void;

export interface INeTemplateBindingHook {
    markChangeDetection?: () => IInvokeDetectChangeFunction;
}

export interface INeTemplateContext {
    skipError: boolean;
    initializeStack: INeProcessingFunction[];
    destroyStack: INeProcessingFunction[];

    templateVaribles: { [id: string]: (HTMLElement | Node | INeElement) };
    listeners: RemoveEventListenerFunction[]; // 取消监听函数
    bindings: INeElementBinding[];
    parentInjector: IInjector;
    bindingRef: INeBindingRef;
    
    rootElements: (INeElement | HTMLElement | Node)[];
    customElements: INeElement[];
    logicElements: INeLogicElement[];

    // 临时变量 HTMLElement | INeElement
    parent: INeElementBinding;
    current: INeElementBinding;
    host: INeElementBinding;

    markChangeDetection: () => IInvokeDetectChangeFunction;
}

export interface INeTemplate {
    constructorStack: INeTemplateCompileFunction[];
}

export interface INeBindingRef {
    readonly inited: boolean;
    readonly destroyed: boolean;
    readonly attached: boolean;
    readonly isPlainTemplate: boolean;
    
    bind(context: any, implicits?: any[]): void;
    implicits(data?: any[]): void;
    setState(value: StateObject, recursiveDetecting?: boolean): void;
    detectChanges(recursive?: boolean): void;
    find(fn: (element: Node) => boolean): Node;
    children(): HTMLElement[];
    getTemplateVarible(id: string): HTMLElement | Node | INeElement;
    parent(): INeBindingRef;
    elements(): (HTMLElement | Node | INeElement)[];

    instance(): any;
    appendTo(parent: Node): void;
    attachTo(placeholder: Node): void;
    attach(): void;
    detach(): void;
    passOnAttach(): void;
    passOnDetach(): void;
    resize(): void;
    destroy(): void;

    appendChild(content: Node): void;
    insertTo(existNode: Node): void;
    setAttribute(property: string, value: string);
    setStyle(property: string, value: string);
    addClass(className: string);
    removeClass(className: string);
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction;
    getBoundingClientRect(): ClientRect;
}

export interface IChangeDetector {
    detectChanges(recursive?: boolean): void;
}

export interface IBindingRefFactory {
    newInstance(providers?: Provider[]): INeBindingRef;
}
// public api
export interface IBindingRef<T> {
    element(id: string): Node | HTMLElement | IElementRef;
    bind(instance: StateObject): IBindingRef<T>;
    setState(state: StateObject, deepMerge?: boolean): IBindingRef<T>;
    instance(): T;
    children(): HTMLElement[];
    appendTo(parent: Node): IBindingRef<T>;
    attachTo(placeholder: Node): IBindingRef<T>;
    hasAttached(): boolean;
    attach(): IBindingRef<T>;
    detach(): IBindingRef<T>;
    resize(): IBindingRef<T>;
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction;
    detectChanges(recursive?: boolean): IBindingRef<T>;
    destroy(): void;

    getBoundingClientRect(): ClientRect;
}

export interface IElementRef {
    isElementRef: boolean;
    element(id: string): Node | HTMLElement | IElementRef;
    hasAttached(): boolean;
    attach(): IElementRef;
    detach(): IElementRef;
    resize(): IElementRef;
    detectChanges(recursive?: boolean): IElementRef;

    getBoundingClientRect(): ClientRect;
}

export interface IElementOptions<T> {
    state?: T | any;
    hostBinding?: IBindingDefinition;
    container?: HTMLElement;
    placeholder?: Node;
    providers?: Provider[];
    parentInjector?: IInjector;
    requirements?: ClassLike[];
    skipError?: boolean;
}

export interface IBootstrapOptions {
    state?: any;
    hostBinding?: IBindingDefinition;
    providers?: Provider[];
    requirements?: ClassLike[];
    skipError?: boolean;
}

export function noop() {};