import { RemoveEventListenerFunction } from './domapi';
import { IInjector, ClassLike } from '../../../helper/injector';

export interface IPropertyChangeEvent {
    property: string;
    value: string;
}

export type StateObject = {[key: string]: any};
export type StateEntries = {[key: string]: any};
export type StateChanges = {
    [chainProperty: string]: {
        oldValue: any;
        newValue: any;
    }
}

export interface IUIState extends StateObject {
    injector?: IInjector;
}
export interface IUIStateStatic<T extends IUIState> {
    new (): T
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
export type AliasName = string;
export type EventName = string;
export type UIBindingSelector = string;
export type UIBindingTemplate = string;
export type BindingStatement = string;
export type BindingProperty = string;
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

export interface IObjectBindingDefinition {
    [attr: string]: BindingProperty;
}

export interface IUIBindingDecoratorOption {
    template: UIBindingTemplate;
    style?: string;
    
    requirements?: ClassLike[];
    properties?: {[propertyName: string]: AliasName};
    emitters?: {[propertyName: string]: string};
    injects?: {[propertyName: string]: InjectToken};
}

export interface IUIBindingMetadata extends IUIBindingDecoratorOption {
    Clazz?: ClassLike;
}

export interface IUIBindingDefinition extends IUIBindingDecoratorOption {
    selector: UIBindingSelector;
}

export interface IBindingScope<T extends StateObject> {
    context?: T;
    implicits?: {[key: string]: any};
}

export interface IElementData<T extends StateObject> {
    scope: IBindingScope<T>
}

export interface ICustomElement<T> {
    readonly placeholder: Node;
    bind(data: IElementData<T>): void;
    firstChild(): Node;
    forEach(fn: (item: HTMLElement) => void): void;
    detectChanges(): void;
    hasAttached(): boolean;
    attach(): void;
    detach(): void;
    resize(): void;
    appendChild(child: HTMLElement | Node): void;
    getAttribute(property: string): any;
    setAttribute(property: string, value: string);
    setStyle(property: string, value: string);
    addClass(className: string);
    removeClass(className: string);
    remove();
    addEventListener(eventName: string, handler: any): RemoveEventListenerFunction;
    destroy();
}

export interface IBindingRef<T extends StateObject> {
    readonly inited: boolean;
    readonly destroyed: boolean;
    // readonly scope: IBindingScope<T>;
    readonly attached: boolean;
    bind(scope?: IBindingScope<T>): void;
    assign(scope: IBindingScope<T>): void;
    implicits(object?: {[key: string]: any}): void;
    firstChild(): Node;
    elements(): (HTMLElement | Node | ICustomElement<T>)[];
    children(): HTMLElement[];
    forEach(fn: (item: HTMLElement) => void): void;
    findCustoms(fn: (item: ICustomElement<T>) => boolean): ICustomElement<T>;
    getTemplateVarible(id: string): HTMLElement | Node | ICustomElement<T>;
    detectChanges(): void;
    appendTo(parent: Node): void;
    attachTo(placeholder: Node): void;
    attach(): void;
    detach(): void;
    resize(): void;
    destroy(): void;

    getBoundingClientRect(): ClientRect;
}

export interface IElementRef<T extends StateObject> {
    setState(state: T | StateEntries): IElementRef<T>;
    getState(): T | StateEntries;
    children(): HTMLElement[];
    appendTo(parent: Node): IElementRef<T>;
    attachTo(placeholder: Node): IElementRef<T>;
    hasAttached(): boolean;
    attach(): IElementRef<T>;
    detach(): IElementRef<T>;
    resize(): IElementRef<T>;
    detectChanges(): IElementRef<T>;
    destroy(): void;

    getBoundingClientRect(): ClientRect;
}

export interface IElement {
    hasAttached(): boolean;
    attach(): IElement;
    detach(): IElement;
    resize(): IElement;
    detectChanges(): IElement;
}

export interface IChangeDetector {
    detectChanges(): void;
}

export type BindingRefFactory<T> = (parentChangeDetector?: () => void) => IBindingRef<T>;
export type BindFunction<T> = (scope: IBindingScope<T>) => void;
export type ProcessingFunction<T> = (scope: IBindingScope<T>) => void;
export interface IInputBindings<T> {
    chains: {
        [chainProp: string]: {
            chainProp: string,
            varible: string,
            outputs: {
                element: HTMLElement | Element | Node | ICustomElement<T>,
                targetKey: string,
                binding: BindFunction<T>;
            }[];
            inputs: {
                element: HTMLElement | Element | Node | ICustomElement<T>,
                targetKey: string,
            }[];
            previousValue: any;
        }
    };
    inputs: BindFunction<T>[];
};

export interface ITemplateContext<T extends StateObject> {
    rootElements: (ICustomElement<T> | HTMLElement | Node)[];
    customElements: ICustomElement<T>[];
    parent: HTMLElement | ICustomElement<T>;
    current: HTMLElement | ICustomElement<T>;

    initializeStack: ProcessingFunction<T>[];
    updateStack: ProcessingFunction<T>[];
    destroyStack: ProcessingFunction<T>[];
    
    isPlainTemplate: boolean;
    templateVaribles: {[id: string]: (HTMLElement | Node | ICustomElement<T>)};
    listeners: RemoveEventListenerFunction[]; // 取消监听函数
    inputBindings: IInputBindings<T>;
    parentInjector: IInjector;
    
    detectChanges: () => void;
}
export type TemplateContextFunction<T extends StateObject> = (context: ITemplateContext<T>) => void;

export function noop() {};