import { IEmitter } from '../../../helper/emitter';
import { isEmpty } from '../../../utils';
import { cssProp2Prop, parseToClassMap, parseToStyleObject, value2CssValue } from '../../../utils/domutils';
import { nativeApi, RemoveEventListenerFunction } from '../common/domapi';
import { IBindingRef, IUIState, noop, IBindingScope, IUIBindingMetadata, AliasName, EventName, IElementData } from '../common/interfaces';
import { ContentElement } from './content';
import { CustomElement, IBeforeInitChanges } from './element';

export interface IUIElementData<T> extends IElementData<T>{
    bindingRef: IBindingRef<IUIState>;
    instance: T;
    metadata: IUIBindingMetadata;
}


export class UIElement<T extends IUIState> extends CustomElement<T> {
    constructor() {
        super();
    }
    protected data: IUIElementData<T>;

    private bindingRef: IBindingRef<IUIState>;
    private instance: IUIState;
    private _contentPlaceholder: ContentElement<T>;
    private _outletStyles = {};
    private _outletClasses = {};
    private _metadata: IUIBindingMetadata;
    private _injectRequired: {[key: string]: boolean} = {};
    private _inputProperties: {[aliasName: string]: string} = {};
    private _outputProperties: {[propertyName: string]: EventName} = {};
    private _elementAttributes = {};
    private _nativeEvents = [];

    private _dirtyStates = {};

    bind(data: IUIElementData<T>): void {
        // TODO 重置状态
        if (this.bindingRef) return;
        this.bindingRef = data.bindingRef;
        this.instance = data.instance;
        this._metadata = data.metadata;
        if (this._metadata) {
            this._inputProperties = {};
            Object.keys(data.metadata.properties).forEach(key => {
                let alias = data.metadata.properties[key];
                alias = alias || key;
                this._inputProperties[alias] = key;
            })
            this._outputProperties = data.metadata.emitters || {};
            this._injectRequired = data.metadata.injects || {};
        }
        super.bind(data);
    }
    setState(state: T) {
        if (state && !isEmpty(state)) {
            this.bindingRef.bind({
                context: state
            });
        }
    }
    firstChild(): Node {
        return this.placeholder.parentNode ? this.placeholder : (this.bindingRef ? this.bindingRef.firstChild() : null);
    }
    detectChanges() {
        super.detectChanges();
        // this.bindingRef && this.bindingRef.detectChanges();
        if (this.bindingRef) {
            if (!isEmpty(this._dirtyStates)) {
                const state = this._dirtyStates;
                this._dirtyStates = {};
                // console.log('bind', state);
                this.bindingRef.bind({
                    context: state
                });
            } else {
                // console.log('detectChanges')
                this.bindingRef.detectChanges();
            }
        }
    }
    forEach(fn: (item: HTMLElement) => void): void {
        this.bindingRef && this.bindingRef.forEach(fn);
    }
    protected _initialize() {
        if (!this.bindingRef) return;
        super._initialize();
    }
    protected _onInit(initChanges: IBeforeInitChanges<T>) {
        super._onInit(initChanges);
        // 设置为状态
        this.bindingRef.bind({
            context: this.instance
        });
        // 插入外部内容
        this._contentPlaceholder = this.bindingRef.findCustoms((element) => {
            return element instanceof ContentElement;
        }) as ContentElement<any>;
        if (this._contentPlaceholder) {
            this._contentPlaceholder.appendChild(initChanges.fragment);
        }
        this._composeInitChanges(initChanges);
        // 插入文档
        this.bindingRef.attachTo(this.placeholder);
        if (this.bindingRef.firstChild()) {
            nativeApi.remove(this.placeholder);
        }
    }
    protected _onUpdate() {
        super._onUpdate();
        this.bindingRef.detectChanges();
    }
    protected _onAttach() {
        super._onAttach();
        this.bindingRef.attach();
        if (this.bindingRef.firstChild()) {
            nativeApi.remove(this.placeholder);
        }
    }
    protected _onDetach() {
        super._onDetach();
        const firstChild = this.bindingRef.firstChild();
        if (firstChild) {
            nativeApi.insertBefore(this.placeholder, firstChild);
        }
        this.bindingRef.detach();
    }
    protected _onResize() {
        super._onResize();
        this.bindingRef.resize();
    }
    protected _onDestroy() {
        super._onDestroy();
        this._nativeEvents.forEach(fn => fn());
        this.instance && this.instance['__emitter'] && this.instance['__emitter'].off();
        this.bindingRef && this.bindingRef.destroy();
    }
    protected _onAppendChild(child: HTMLElement | Node): void {
        this._contentPlaceholder && this._contentPlaceholder.appendChild(child);
    }
    protected _onGetAttribute(property: string) {
        if (property in this._elementAttributes) {
            return this._elementAttributes[property];
        } else {
            return this.instance[property];
        }
    }
    protected _onSetAttribute(property: string, value: string) {
        this._setAttrs({[property]: value});
    }
    protected _onSetStyle(property: string, value: string) {
        property = (property || '').trim();
        if (!property) return;
        property = cssProp2Prop(property);
        value = value2CssValue(property, value);
        if (this._outletStyles[property] !== value) {
            this._outletStyles[property] = value;
            this.forEach((item) => {
                nativeApi.setStyle(item, property, value);
            })
        }
    }
    protected _onAddClass(className: string) {
        const classMap = parseToClassMap(className);
        Object.keys(classMap).forEach(key => {
            if (key && !this._outletClasses[key]) {
                this._outletClasses[key] = true;
                this.forEach((item) => {
                    nativeApi.addClass(item, key);
                });
            }
        });
    }
    protected _onRemoveClass(className: string) {
        const classMap = parseToClassMap(className);
        Object.keys(classMap).forEach(key => {
            if (key && this._outletClasses[key]) {
                delete this._outletClasses[key];
                this.forEach((item) => {
                    nativeApi.removeClass(item, key);
                });
            }
        });
    }
    protected _onAddEventListener(eventName: string, handler: any): RemoveEventListenerFunction {
        if (!eventName) return noop;
        if (eventName in this._outputProperties) {
            if (this.instance[eventName]) {
                if (typeof this.instance[eventName] === 'function' && this.instance['__emitter']) {
                    // 如果为函数绑定，则直接监听事件名称
                    eventName = this._outputProperties[eventName];
                    const eventEmitter = this.instance['__emitter'].on(eventName, handler);
                    return () => eventEmitter.off(eventName, handler);
                } else {
                    return (this.instance[eventName] as IEmitter<any>).listen(handler);
                }
            } else {
                return noop;
            }
        } else if (this._isTwoWayBinding(eventName)) {
            // 双向绑定
            const inputKey = this._inputProperties[eventName] || eventName;
            eventName = `${inputKey}Change`;
            if (this.instance[eventName] && typeof this.instance[eventName].listen === 'function' && typeof this.instance[eventName].emit === 'function') {
                return (this.instance[eventName] as IEmitter<any>).listen(handler);
            } else {
                return noop;
            }
        } else {
            const removes = [];
            this.forEach((item) => {
                removes.push(nativeApi.addEventListener(item, eventName, handler));
            })
            const removeListening = () => {
                removes.forEach(fn => fn());
                const index = this._nativeEvents.indexOf(removeListening);
                if (index !== -1) {
                    this._nativeEvents.splice(index, 1);
                }
            };
            this._nativeEvents.push(removeListening);
            return removeListening;
        }
    }
    private _resetStyle(styleString: string | any) {
        const style = typeof styleString === 'string' ? parseToStyleObject(styleString) : (styleString || {});
        Object.keys(style).forEach(key => {
            if (key) {
                this.forEach((item) => {
                    nativeApi.setStyle(item, key, (style[key] || ''));
                })
            }
            if (key in this._outletStyles) {
                delete this._outletStyles[key];
            }
        });
        Object.keys(this._outletStyles).forEach(key => {
            if (key) {
                this.forEach((item) => {
                    nativeApi.setStyle(item, key, '');
                })
            }
        });
        this._outletStyles = style;
    }
    private _resetClass(className: string | any) {
        const classMap = typeof className === 'string' ? parseToClassMap(className) : (className || {});
        Object.keys(classMap).forEach(key => {
            if (key) {
                this.forEach((item) => {
                    if (classMap[key]) {
                        nativeApi.addClass(item, key);
                    } else {
                        nativeApi.removeClass(item, key);
                    }
                })
                !classMap[key] && (delete classMap[key]);
            }
            if (key in this._outletClasses) {
                delete this._outletClasses[key];
            }
        });
        Object.keys(this._outletClasses).forEach(key => {
            if (key) {
                this.forEach((item) => {
                    nativeApi.removeClass(item, key);
                })
            }
        });
        this._outletClasses = classMap;
    }
    private _isTwoWayBinding(key) {
        if (!this._isInputProperty(key)) return false;
        const inputKey = this._inputProperties[key] || key;
        key = `${inputKey}Change`;
        if (this.instance[key] && typeof this.instance[key].listen === 'function' && typeof this.instance[key].emit === 'function') return true;
        return false;
    }
    private _isInputProperty(key) {
        if (!key) return false;
        if (key in this._inputProperties) return true;
        return false;
    }
    private _setAttrs(attrs: any) {
        attrs = attrs || {};
        // const states = {};
        Object.keys(attrs).forEach(key => {
            if (key) {
                if (this._isInputProperty(key)) {
                    key = this._inputProperties[key] || key;
                    // states[key] = attrs[key];
                    this._dirtyStates[key] = attrs[key];
                } else {
                    this._elementAttributes[key] = attrs[key];
                    this.forEach((item) => {
                        nativeApi.setAttribute(item, key, attrs[key]);
                    });
                }
            }
        });
        // if (!isEmpty(states)) {
        //     this.bindingRef.bind({
        //         context: states,
        //     });
        // }
    }
    private _initEvents(events) {
        Object.keys(events || {}).forEach(key => {
            key = (key || '').trim();
            if (key) {
                const pendings = events[key];
                if (key in this._outputProperties) {
                    if (this.instance[key]) {
                        let eventName = key;
                        if (typeof this.instance[key] === 'function' && this.instance['__emitter']) {
                            // 如果为函数绑定，则直接监听事件名称
                            eventName = this._outputProperties[key];
                            pendings.forEach(pending => {
                                pending.remove = this.instance['__emitter'].on(eventName, pending.handler);
                            });
                        } else {
                            pendings.forEach(pending => {
                                pending.remove = (this.instance[key] as IEmitter<any>).listen(pending.handler);
                            });
                        }
                    }
                } else if (this._isTwoWayBinding(key)) {
                    // 双向绑定
                    const inputKey = this._inputProperties[key] || key;
                    key = `${inputKey}Change`;
                    if (this.instance[key] && typeof this.instance[key].listen === 'function' && typeof this.instance[key].emit === 'function') {
                        pendings.forEach(pending => {
                            pending.remove = (this.instance[key] as IEmitter<any>).listen(pending.handler);
                        });
                    }
                } else {
                    pendings.forEach(pending => {
                        const removes = [];
                        this.forEach((item) => {
                            removes.push(nativeApi.addEventListener(item, key, pending.handler));
                        })
                        const removeListening = () => {
                            removes.forEach(fn => fn());
                            const index = this._nativeEvents.indexOf(removeListening);
                            if (index !== -1) {
                                this._nativeEvents.splice(index, 1);
                            }
                        };
                        this._nativeEvents.push(removeListening);
                        pending.remove = removeListening;
                    });
                }
            }
        })
    }
    private _composeInitChanges(initChanges: IBeforeInitChanges<T>) {
        // class
        this._resetClass(initChanges.classes);
        // styles
        this._resetStyle(initChanges.styles);
        // attrs
        this._setAttrs(initChanges.attributes);
        // events
        this._initEvents(initChanges.events);
    }
}