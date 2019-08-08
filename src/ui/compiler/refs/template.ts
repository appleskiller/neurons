import { ClassLike, Provider, IInjector, injector } from '../../../helper/injector';
import { globalLimitedDictionary, isEmpty, merge } from '../../../utils';
import { IXMLASTNode, parseXML, XMLASTNodeType } from '../../../utils/xmlutils';
import { attachTempalateElementProperty, buildinBindingProviders, bindingInjector } from '../../factory/injector';
import { nativeApi } from '../common/domapi';
import { BuildInsVaribles } from '../common/enums';
import { BindingRefFactory, IBindingDefinition, IBindingRef, IBindingScope, ITemplateContext, IUIState, StateObject, TemplateContextFunction, UIBindingTemplate } from '../common/interfaces';
import { composeVaribles, createBindingFunction, callDynamicFunction } from '../common/util';
import { ContentElement } from '../custom/content';
import { ForElement } from '../custom/for';
import { UIElement } from '../custom/ui';
import { processAttrs } from '../processors/attributes';
import { processContent } from '../processors/content';
import { parseStatement } from '../processors/parser';
import { processTag } from '../processors/tag';
import { BindingRef } from './binding';
import { createUIStateInstance, findUIBindingMetadata, getUIBindingMetadata, hasUIBindingMetadata } from './ui';

function isRepeatNode(node: IXMLASTNode): boolean {
    if (!!node && !!node.name && !!node.attrs && !!node.attrs['*for']) {
        let statement = (node.attrs['*for'] || '').trim();
        if (statement.indexOf(' in ') !== -1) {
            let arr = statement.split(' in ');
            statement = arr[1].trim();
        }
        return !!statement;
    }
    return false;
}
// -----------------------------------------------------------
// repeat(for) node
// ===========================================================
// `*for="item in array"`
// `*for="item, index in array"`
// `*for="item, index in [0, 1, 2]"`
// `*for="[0, 1, 2]" let-item let-index="$index"`
function processRepeatNode<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    if (!isRepeatNode(node)) return false;
    node = {
        ...node,
        attrs: { ...node.attrs }
    }
    let statement = (node.attrs['*for'] || '').trim();
    delete node.attrs['*for'];
    // const scopeVaribles = {};
    let itemName, indexName;
    if (statement.indexOf(' in ') !== -1) {
        let arr = statement.split(' in ');
        statement = arr[1].trim();
        arr = arr[0].split(',');
        itemName = (arr[0] || '').trim();
        indexName = (arr[1] || '').trim();
    }
    Object.keys(node.attrs).forEach(key => {
        const value = node.attrs[key];
        if (key.indexOf('let-') === 0) {
            const prop = key.substr(4).trim();
            if (prop) {
                if (!value || value === BuildInsVaribles.$item) {
                    itemName = prop;
                    delete node.attrs[key];
                } else if (value === BuildInsVaribles.$index) {
                    indexName = prop;
                    delete node.attrs[key];
                }
            }
        }
    });
    const info = parseStatement(statement);
    const isEmptyChain = isEmpty(info.chainProps);
    const factory: BindingRefFactory<T> = createBindingRefFactory(node);
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = new ForElement(factory, statement, itemName, indexName);
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element.placeholder);
            } else {
                context.parent.appendChild(element.placeholder);
            }
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.current = element;
        const inputBindings = context.inputBindings;
        context.initializeStack.push(function (scope: IBindingScope<T>) {
            let previousValue;
            const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${statement})`);
            const setter = function (scope: IBindingScope<T>, value: any) {
                if (previousValue !== value) {
                    element.bind({
                        scope: scope,
                        object: value
                    });
                    previousValue = value;
                }
            }
            const binded = createBindingFunction(element, inputBindings, info, '*for', statement, getter, setter);
            binded(scope);
        });
        context.destroyStack.push(function (scope: IBindingScope<T>) {
            element.destroy();
        })
        if (!isEmptyChain) {
            context.isPlainTemplate = false;
        }
    });
    return true;
}
// -----------------------------------------------------------
// dynamic ui binding node
// ===========================================================
function isDynamicUIBindingNode(node: IXMLASTNode) {
    return node.name === 'ne-binding';
}
function processDynamicUIBindingNode<T extends IUIState>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    if (!isDynamicUIBindingNode(node)) return false;
    node = {
        ...node,
        attrs: { ...node.attrs }
    }
    let selector, statement, stateStatement;
    Object.keys(node.attrs).forEach(key => {
        if (key === '*bind') {
            statement = node.attrs[key];
            delete node.attrs[key];
        } else if (key === '*state') {
            stateStatement = node.attrs[key];
            delete node.attrs[key];
        }
    });
    if (!statement) {
        processTag(node, constructorStack);
        return true;
    }
    const stateInfo = parseStatement(stateStatement || '');
    const info = parseStatement(statement);
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element: UIElement<T> = new UIElement();
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element.placeholder);
            } else {
                context.parent.appendChild(element.placeholder);
            }
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.current = element;
        const inputBindings = context.inputBindings;
        const parentInjector = context.parentInjector;
        let instance, inited = false, bindingRef: IBindingRef<T>, metadata, initialState;
        // stateStatement
        // 先执行*state，避免*binding和*state同时变更所导致的state被略过的问题
        // TODO 考虑封装动态element解决此问题
        if (stateStatement) {
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                let previousValue;
                const getter = new Function('', `${composeVaribles(stateInfo, scope.implicits)}\nreturn (${stateStatement})`);
                const setter = function (scope: IBindingScope<T>, value: any) {
                    if (!inited) {
                        initialState = value;
                        previousValue = initialState;
                    } else {
                        if (initialState) {
                            // 跳过初始化的第一次状态更新，因为在创建实例时已经进行了处理
                            initialState = null;
                        } else {
                            if (previousValue !== value) {
                                previousValue = value;
                                element.setState(value);
                            }
                        }
                    }
                }
                const binded = createBindingFunction(element, inputBindings, stateInfo, '*state', stateStatement, getter, setter);
                binded(scope);
            });
        }
        context.initializeStack.push(function (scope: IBindingScope<T>) {
            const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${statement})`);
            const setter = function (scope: IBindingScope<T>, value: any) {
                // TODO 暂时不支持重置动态实例
                if (inited || !value || !value.source) return;
                const source = value.source;
                const hostBinding = value.hostBinding;
                if (typeof source === 'string' && hasUIBindingMetadata(source)) {
                    // selector
                    bindingRef = createDynamicBindingRefFromSelector(source, hostBinding, null, parentInjector);
                } else if (typeof source === 'function') {
                    const finded = findUIBindingMetadata(source);
                    const selector = finded[0] || 'div';
                    bindingRef = createDynamicBindingRefFromSelector(selector, hostBinding, null, parentInjector);
                } else {
                    bindingRef = createDynamicBindingRef<T>(source, hostBinding, null, parentInjector);
                }
                instance = initialState || {};
                // TODO 暂时不支持重置动态实例
                if (!inited && instance) {
                    inited = true;
                    element.bind({
                        scope: scope,
                        bindingRef: bindingRef,
                        instance: instance,
                        metadata: null,
                    });
                }
            }
            const binded = createBindingFunction(element, inputBindings, info, 'ne-binding', statement, getter, setter);
            binded(scope);
        });
        context.destroyStack.push(function (scope: IBindingScope<T>) {
            element.destroy();
        });
        if (!isEmpty(info.chainProps)) {
            context.isPlainTemplate = false;
        }
    });
    // 处理属性
    processAttrs(node, constructorStack);
    // 处理子元素
    processChildNodes(node, constructorStack);
    return true;
}
// -----------------------------------------------------------
// content node
// ===========================================================
function processContentNode<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    if (node.name !== 'content') return false;
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = new ContentElement();
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element.placeholder);
            } else {
                context.parent.appendChild(element.placeholder);
            }
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.current = element;
        // context.initializeStack.push(function (scope: IBindingScope<T>) {
        //     element.bind(scope);
        // });
        // context.destroyStack.push(function (scope: IBindingScope<T>) {
        //     element.destroy();
        // });
    });
    return true;
}
// -----------------------------------------------------------
// ui state node
// ===========================================================
function matchUIBindingNode(node: IXMLASTNode) {
    if (hasUIBindingMetadata(node.name)) return {
        selector: node.name,
        selectorType: 'tag',
    };
    // TODO tag[attr] & [attr]
    return null;
}
function processUIBindingNode<T extends IUIState>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    const match = matchUIBindingNode(node);
    if (!match) return false;
    // TODO tag[attr] & [attr]
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element: UIElement<T> = new UIElement();
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element.placeholder);
            } else {
                context.parent.appendChild(element.placeholder);
            }
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.current = element;
        const parentInjector = context.parentInjector;
        context.initializeStack.push(function (scope: IBindingScope<T>) {
            const metadata = getUIBindingMetadata(match.selector);
            const bindingRef = createBindingRef<T>(metadata.template, null, null, null, parentInjector);
            const providers = buildinBindingProviders(bindingRef);
            const instance = createUIStateInstance(match.selector, providers, parentInjector) as T;
            attachTempalateElementProperty(instance, bindingRef);
            element.bind({
                bindingRef: bindingRef,
                scope: scope,
                instance: instance,
                metadata: metadata,
            });
        });
        context.destroyStack.push(function (scope: IBindingScope<T>) {
            element.destroy();
        })
    });
    // 处理属性
    processAttrs(node, constructorStack);
    // 处理子元素
    processChildNodes(node, constructorStack);
    return true;
}
// -----------------------------------------------------------
// normal node
// ===========================================================
function processChildNodes<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    // 处理子元素
    if (node.childNodes && !!node.childNodes.length) {
        const childStack = [];
        node.childNodes.forEach(function (node) {
            processNode(node, childStack)
        });
        constructorStack.push(function (context: ITemplateContext<T>) {
            // 切换context
            const current = context.current;
            const that = this;
            childStack.forEach(child => {
                context.parent = current;
                child.call(that, context);
            });
        });
    }
}
export function processNode<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    if (processContentNode(node, constructorStack)) return;
    if (processRepeatNode(node, constructorStack)) return;
    if (processDynamicUIBindingNode(node, constructorStack as any[])) return;
    if (processUIBindingNode(node, constructorStack as any[])) return;
    if (node.type === XMLASTNodeType.TEXT) {
        // text 内容
        processContent(node, constructorStack);
    } else if (!!node.name) {
        // 处理tag
        processTag(node, constructorStack);
        // 处理属性
        processAttrs(node, constructorStack);
    }
    processChildNodes(node, constructorStack);
}

export function processElement<T>(element: HTMLElement, constructorStack: TemplateContextFunction<T>[]) {
    constructorStack.push(function (context: ITemplateContext<T>) {
        context.rootElements.push(element);
        context.current = element;
    });
}

// -----------------------------------------------------------
// creators
// ===========================================================

const templateCompileCache = globalLimitedDictionary<IXMLASTNode>('ui.template_compile_cache');
export function createBindingRef<T extends StateObject>(
    templateOrNode: string | IXMLASTNode,
    parentChangeDetector?: () => void,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parentInjector?: IInjector
): IBindingRef<T> {
    if (!templateOrNode) {
        return new BindingRef(null);
    } else {
        let node;
        if (typeof templateOrNode === 'string') {
            node = templateCompileCache.get(templateOrNode);
            if (!node) {
                node = parseXML(templateOrNode);
                templateCompileCache.set(templateOrNode, node);
            }
        } else {
            node = templateOrNode;
        }
        // 补充属性绑定
        node.childNodes.forEach(n => {
            n.attrs = n.attrs || {};
            Object.assign(n.attrs, hostBinding);
        });
        // 解析AST
        const constructorStack = [];
        processNode(node, constructorStack);
        let injector = parentInjector || bindingInjector;
        providers && (injector = injector.create(providers));
        return new BindingRef(constructorStack, parentChangeDetector, injector);
    }
}
/**
 * 使用selector创建绑定，有必要创建绑定关系，否则状态和输出无法与内部示例产生联系。
 * @author AK
 * @template T 
 * @param selector 
 * @param [hostBinding] 绑定关系{"attr": "value", [input]: statement, (output): statement}
 * @returns dynamic binding ref from selector 
 */
export function createDynamicBindingRefFromSelector<T extends StateObject>(
    selector: string,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parentInjector?: IInjector
): IBindingRef<T> {
    selector = selector || 'div';
    return createBindingRef(`<${selector}/>`, null, hostBinding, providers, parentInjector);
}
export function createDynamicBindingRef<T extends StateObject>(
    element: UIBindingTemplate | HTMLElement | ClassLike,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parentInjector?: IInjector
): IBindingRef<T> {
    hostBinding = hostBinding || {};
    const constructorStack = [];
    if (typeof element === 'function') {
        // 如果为组件类对象
        const finded = findUIBindingMetadata(element);
        const selector = finded[0] || 'div';
        return createDynamicBindingRefFromSelector(selector, hostBinding, providers, parentInjector);
    } else if (typeof element === 'string'){
        // 如果为模板字符串
        return createBindingRef(element, null, hostBinding, providers, parentInjector);
    } else if (element instanceof Node && (element.nodeType === 1)) {
        // 如果为真实的Dom元素
        // 处理节点
        processElement(element as HTMLElement, constructorStack)
        // 处理属性
        const node = {
            type: XMLASTNodeType.TAG,
            startIndex: 0,
            endIndex: 0,
            attrs: hostBinding
        };
        processAttrs(node, constructorStack);
        let injector = parentInjector || bindingInjector;
        providers && (injector = injector.create(providers));
        return new BindingRef<T>(constructorStack, null, injector);
    } else {
        return new BindingRef([]);
    }
}

export function createBindingRefFactory<T>(node: IXMLASTNode): BindingRefFactory<T> {
    return (parentChangeDetector?: () => void) => {
        const bindingRef = createBindingRef(node, parentChangeDetector);
        // TODO 目前只有for会使用BindingRefFactory
        // 现在的问题时，基于for node创建的binding因为包含父级作用域的绑定信息，因此for会用父级作用域的状态对象完成绑定
        // 因为bindingRef的自身存在回调状态对象Hook的行为，for的这种绑定方式会在运行时触发父级状态对象的钩子函数，这是一个重大的错误
        // 暂时通过特殊标记进行解决，未来需要重构类似for这样的中断部分node初始化处理，延后执行绑定的运行场景
        bindingRef['isSubBindingRef'] = true;
        return bindingRef;
    };
}