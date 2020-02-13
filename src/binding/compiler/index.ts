import { parseHTML, IHTMLASTRoot, IHTMLASTNode, HTMLASTNodeType, parseNode } from './parser/template';
import { globalLimitedDictionary } from 'neurons-utils';
import { INeTemplateContextFunction, INeTemplate, INeTemplateContext, IUIState, INeBindingScope, IBindingRefFactory, IBindingDefinition, INeBindingRef, INeTemplateBindingHook, IAttributeBindingMetadata, INeElementBinding, INeElement, BindingSelector, BindingTemplate } from '../common/interfaces';
import { nativeApi, domapi } from '../common/domapi';
import { processContent } from './processor/content';
import { isEmpty } from 'neurons-utils';
import { processInputs } from './processor/input';
import { processOutputs } from './processor/output';
import { processTwoWays } from './processor/twoway';
import { processClassInputs, processPlainClasses } from './processor/class';
import { processStyleInputs, processPlainStyles } from './processor/style';
import { hasUIBindingMetadata, getUIBindingMetadata, hasLogicBindingMetadata, getLogicBindingMetadata, hasAttributeBindingMetadata, matchAttributeBindingMetadata, IAttributeBindingMatch, createAttributeBindingInstance, getAttributeBindingMetadata, createUIBindingInstance, findUIBindingMetadata } from '../factory/binding';
import { buildinBindingProviders, bindingInjector, injectTempalateVaribles } from '../factory/injector';
import { composeGetter } from '../common/util';
import { NeBindingRef, NeImplicitsBindingRef, NeAttributeBindingRef } from '../refs/binding';
import { parseStatement } from './parser/statement';
import { Provider, IInjector, ClassLike } from 'neurons-injector';
import { markChangeDetection } from '../refs/change';
import { processPlainAttrs } from './processor/attrs';
import { getBindingElementClass, BindingElementTypes } from '../factory/element';

const templateCompileCache = globalLimitedDictionary<INeTemplate>('neurons.template_compile_cache');
const selectorCompileCache = globalLimitedDictionary<INeTemplate>('neurons.selector_compile_cache');

export function bindSource<T extends IUIState>(
    source: BindingSelector | BindingTemplate | HTMLElement | ClassLike,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parent?: INeBindingRef,
    parentInjector?: IInjector
): INeBindingRef {
    let bindingRef: INeBindingRef;
    if (typeof source === 'string' && hasUIBindingMetadata(source)) {
        // selector
        bindingRef = bindSelector(source, hostBinding, providers, parent, parentInjector);
    } else if (typeof source === 'function') {
        const finded = findUIBindingMetadata(source);
        const selector = finded[0] || 'div';
        bindingRef = bindSelector(selector, hostBinding, providers, parent, parentInjector);
    } else if (source instanceof Node && (source.nodeType === 1)) {
        // html element
        bindingRef = bindElement(source as HTMLElement, hostBinding, providers, parent, parentInjector);
    } else {
        // template
        bindingRef = bindTemplate(source, providers, parent, parentInjector);
    }
    return bindingRef;
}

export function bindTemplate(
    template: string,
    providers?: Provider[],
    parent?: INeBindingRef,
    parentInjector?: IInjector
): INeBindingRef {
    const tpl = compile(template);
    let injector = parentInjector || bindingInjector;
    providers && (injector = injector.create(providers));
    const ref = new NeBindingRef(tpl.constructorStack, parent, injector);
    return ref;
}

export function bindSelector(
    selector: string,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parent?: INeBindingRef,
    parentInjector?: IInjector
) {
    const tpl = compileSelector(selector, hostBinding);
    let injector = parentInjector || bindingInjector;
    providers && (injector = injector.create(providers));
    const ref = new NeBindingRef(tpl.constructorStack, parent, injector);
    return ref;
}

export function bindElement(
    element: HTMLElement,
    hostBinding?: IBindingDefinition,
    providers?: Provider[],
    parent?: INeBindingRef,
    parentInjector?: IInjector
): INeBindingRef {
    const constructorStack = [];
    processElement(element, hostBinding, constructorStack);
    let injector = parentInjector || bindingInjector;
    providers && (injector = injector.create(providers));
    const ref = new NeBindingRef(constructorStack, parent, injector);
    return ref;
}

export function compile(content: string): INeTemplate {
    let template = templateCompileCache.get(content);
    if (template) return template;
    const root = parseHTML(content);
    template = {
        isPlainTemplate: root.isPlainTemplate,
        constructorStack: [],
    };
    processNode(root, template.constructorStack);
    templateCompileCache.set(content, template);
    return template;
}

export function compileSelector(selector: string, hostBinding: IBindingDefinition): INeTemplate {
    const cacheKey = `${selector}::${Object.keys(hostBinding || {}).map(key => `${key}=${hostBinding[key]}`).join(',')}`;
    let template = selectorCompileCache.get(cacheKey);
    if (template) return template;
    const content = `<${selector}/>`;
    const root = parseHTML(`<${selector}/>`);
    root.childNodes.forEach(n => {
        parseNode(n, hostBinding);
    });
    template = {
        isPlainTemplate: root.isPlainTemplate,
        constructorStack: [],
    };
    processNode(root, template.constructorStack);
    selectorCompileCache.set(cacheKey, template);
    return template;
}

export function processNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    if (processContentNode(node, constructorStack)) return;
    if (processDynamicBindingNode(node, constructorStack as any[])) return;
    if (processLogicBindingNode(node, constructorStack as any[])) return;
    if (processUIBindingNode(node, constructorStack as any[])) return;
    if (node.type === HTMLASTNodeType.TEXT) {
        // text 内容
        processContent(node, constructorStack);
    } else if (!!node.name) {
        // 分析节点绑定和属性绑定
        const bindings = resolveNodeBindings(node);
        // 处理tag
        processTag(bindings.node, constructorStack);
        // 处理属性
        processAttributes(bindings.node, constructorStack);
        // 处理子节点
        processChildNodes(bindings.node, constructorStack);
        // 处理属性组件绑定
        processAttrNodes(bindings.attrNodes, constructorStack);
    } else {
        processChildNodes(node, constructorStack);
    }
}

function fakeAttributeNode(node: IHTMLASTNode, selector: string): IHTMLASTNode {
    return {
        type: HTMLASTNodeType.ATTRIBUTE,
        startIndex: node.startIndex,
        endIndex: node.endIndex,

        parentNode: node.parentNode,
        childNodes: [],

        name: selector,
        attrs: {},
        inputs: {},
        outputs: {},
        twoWays: {},
    }
}

function resolveNodeBindings(node: IHTMLASTNode): { attrNodes: IHTMLASTNode[], node: IHTMLASTNode } {
    const matchs: { [attribute: string]: IAttributeBindingMatch } = {};
    const properties = {};
    const results: { attrNodes: IHTMLASTNode[], node: IHTMLASTNode } = {
        attrNodes: [],
        node: node
    };
    let matched = matchAttributeBindingMetadata(node.name, node.attrs);
    matched && Object.assign(matchs, matched);
    matched = matchAttributeBindingMetadata(node.name, node.inputs);
    matched && Object.assign(matchs, matched);
    matched = matchAttributeBindingMetadata(node.name, node.twoWays);
    matched && Object.assign(matchs, matched);
    if (!isEmpty(matchs)) {
        const bindingNode = { ...node };
        results.node = bindingNode;
        const bindingMetadata = getUIBindingMetadata(node.name);
        const bindingInputs = bindingMetadata && bindingMetadata.properties ? bindingMetadata.properties : {};
        const bindingOutputs = bindingMetadata && bindingMetadata.emitters ? bindingMetadata.emitters : {};
        const attrs = {}, inputs = {}, outputs = {}, twoWays = {};
        Object.values(matchs).forEach(item => {
            const attrNode = fakeAttributeNode(bindingNode, item.selector);
            results.attrNodes.push(attrNode);
            const attrInputs = item.metadata.properties || {};
            const attrOutputs = item.metadata.emitters || {};
            // 1. attrs
            let deleted = false;
            !isEmpty(bindingNode.attrs) && Object.keys(bindingNode.attrs).forEach(key => {
                const isAttrInput = attrInputs[key] || key === item.attribute;
                // 如果bindingInputs不存在此key则稍后删除，避免作为普通属性标记在实际的dom元素中
                isAttrInput && !bindingInputs[key] && (deleted = true);
                // 如果属性节点存在key描述则记录此binding到attrNode上
                isAttrInput && (attrNode.attrs[key] = bindingNode.attrs[key]);
                // 如果属性节点不存在key或者bindingInputs存在key，则记录此binding到bindingNode上
                (!isAttrInput || bindingInputs[key]) && (attrs[key] = bindingNode.attrs[key]);
            });
            // 如果存在需要删除的属性，则替换attrs
            deleted && (bindingNode.attrs = attrs);
            // 2. inputs
            deleted = false;
            !isEmpty(bindingNode.inputs) && Object.keys(bindingNode.inputs).forEach(key => {
                const isAttrInput = attrInputs[key] || key === item.attribute;
                isAttrInput && !bindingInputs[key] && (deleted = true);
                isAttrInput && (attrNode.inputs[key] = bindingNode.inputs[key]);
                (!isAttrInput || bindingInputs[key]) && (inputs[key] = bindingNode.inputs[key]);
            });
            // 如果存在需要删除的属性，则替换attrs
            deleted && (bindingNode.inputs = inputs);
            // 3. outputs
            deleted = false;
            !isEmpty(bindingNode.outputs) && Object.keys(bindingNode.outputs).forEach(key => {
                const isAttrOutput = attrOutputs[key] || attrOutputs[`${key}Change`];
                const isBindingOutput = bindingOutputs[key] || bindingOutputs[`${key}Change`];
                isAttrOutput && !isBindingOutput && (deleted = true);
                isAttrOutput && (attrNode.outputs[key] = bindingNode.outputs[key]);
                (!isAttrOutput || isBindingOutput) && (outputs[key] = bindingNode.outputs[key]);
            });
            // 如果存在需要删除的属性，则替换attrs
            deleted && (bindingNode.outputs = outputs);
            // 4. twoways
            deleted = false;
            !isEmpty(bindingNode.twoWays) && Object.keys(bindingNode.twoWays).forEach(key => {
                const isAttrTwoway = attrInputs[key] && attrOutputs[`${key}Change`];
                const isBindingTwoway = bindingInputs[key] && bindingOutputs[`${key}Change`];
                isAttrTwoway && !isBindingTwoway && (deleted = true);
                isAttrTwoway && (attrNode.twoWays[key] = bindingNode.twoWays[key]);
                (!isAttrTwoway || isBindingTwoway) && (twoWays[key] = bindingNode.twoWays[key]);
            });
            // 如果存在需要删除的属性，则替换attrs
            deleted && (bindingNode.twoWays = outputs);
        });
    }
    return results;
}

// -----------------------------------------------------------
// child nodes
// ===========================================================
export function processChildNodes(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    // 处理子元素
    if (node.childNodes && !!node.childNodes.length) {
        const childStack = [];
        node.childNodes.forEach(function (node) {
            processNode(node, childStack)
        });
        constructorStack.push(function (context: INeTemplateContext) {
            // 切换context
            const parent = context.parent;
            const current = context.current;
            const that = this;
            childStack.forEach(child => {
                // 保持parent
                context.parent = current;
                child.call(that, context);
            });
            context.parent = context.parent;
            context.current = current;
        });
    }
}
// -----------------------------------------------------------
// attribute node
// ===========================================================
export function processAttrNodes(nodes: IHTMLASTNode[], constructorStack: INeTemplateContextFunction[]) {
    if (nodes.length) {
        const stack = [];
        nodes.forEach(function (node) {
            processAttrNode(node, stack);
        });
        constructorStack.push(function (context: INeTemplateContext) {
            // host
            context.host = context.current;
            const that = this;
            stack.forEach(child => {
                child.call(that, context);
            });
        });
    }
}

export function processAttrNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    constructorStack.push(function (context: INeTemplateContext) {
        const host = context.host;
        // TODO 尚未支持自定义元素
        // const factory = createAttributEBindingRefFactory(node.name, host.element, context.bindingRef, context.parentInjector);
        const factory = createAttributEBindingRefFactory(node.name, host.element as HTMLElement, context.bindingRef, context.parentInjector);
        const clazz = getBindingElementClass(BindingElementTypes.ATTRIBUTE);
        const element = new clazz(node.name, factory);
        context.current = {
            element: element,
            bindings: {},
        };

        context.customElements.push(element);
        context.bindings.push(context.current);
        context.initializeStack.push(function (scope: INeBindingScope) {

        });
        context.destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        })
    });
    // 处理attrs
    processPlainAttrs(node, constructorStack);
    // 处理inputs绑定
    processInputs(node, constructorStack);
    // 处理outputs绑定
    processOutputs(node, constructorStack);
    // 处理twoWays绑定
    processTwoWays(node, constructorStack);
    return true;
}

export function processAttributes(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    // 处理attrs
    processPlainAttrs(node, constructorStack);
    // 处理classes
    processPlainClasses(node, constructorStack);
    // 处理styles
    processPlainStyles(node, constructorStack);
    // 处理inputs绑定
    processInputs(node, constructorStack);
    // 处理outputs绑定
    processOutputs(node, constructorStack);
    // 处理twoWays绑定
    processTwoWays(node, constructorStack);
    // 处理class绑定
    processClassInputs(node, constructorStack);
    // 处理style绑定
    processStyleInputs(node, constructorStack);
}

function createAttributEBindingRefFactory(
    selector: string,
    hostElement: HTMLElement | INeElement,
    hostBindingRef: INeBindingRef,
    parentInjector: IInjector,
): IBindingRefFactory {
    const metadata = getAttributeBindingMetadata(selector);
    const hostBinding = metadata.hostBinding;
    const factory: IBindingRefFactory = {
        newInstance: (providers?: Provider[]) => {
            const constructorStack = [];
            processElement(hostElement, hostBinding, constructorStack);
            let injector = parentInjector || bindingInjector;
            providers && (injector = injector.create(providers));
            const ref = hostElement instanceof Node
                ? new NeAttributeBindingRef(constructorStack, hostElement, hostBindingRef, injector)
                : null; // TODO
            const buildInProviders = buildinBindingProviders(ref);
            const instance = createAttributeBindingInstance(selector, buildInProviders, injector);
            injectTempalateVaribles(instance, ref);
            ref.bind(instance);
            return ref;
        }
    };
    return factory;
}

// -----------------------------------------------------------
// tag binding
// ===========================================================
export function processTag(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const tagName = node.name;
    const xmlns = node.xmlns;
    constructorStack.push(function (context: INeTemplateContext) {
        const element = nativeApi.createElement(tagName, '', null, xmlns);
        // 记录模板id
        node.id && (context.templateVaribles[node.id] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element);
        } else {
            context.rootElements.push(element);
        }
        context.bindings.push(context.current);
    });
}

// -----------------------------------------------------------
// dom binding
// ===========================================================
export function processElement(element: HTMLElement | INeElement, hostBinding: IBindingDefinition, constructorStack: INeTemplateContextFunction[]) {
    constructorStack.push(function (context: INeTemplateContext) {
        context.rootElements.push(element);
        context.current = {
            element: element,
            bindings: {},
        };
        context.bindings.push(context.current);
    });
    const node = parseNode({
        type: HTMLASTNodeType.TAG,
        name: '',
        startIndex: 0,
        endIndex: 0,
        attrs: {},
    }, hostBinding);
    // 处理属性
    processAttributes(node, constructorStack);
}
// -----------------------------------------------------------
// content node
// ===========================================================
function processContentNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    if (node.name !== 'content') return false;
    constructorStack.push(function (context: INeTemplateContext) {
        const clazz = getBindingElementClass(BindingElementTypes.CONTENT);
        const element = new clazz();
        // 记录模板id
        node.id && (context.templateVaribles[node.id] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element.placeholder);
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.bindings.push(context.current);
        context.destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        })
    });
    return true;
}
// -----------------------------------------------------------
// ui binding node
// ===========================================================
function matchUIBindingNode(node: IHTMLASTNode) {
    if (hasUIBindingMetadata(node.name)) return {
        selector: node.name,
        selectorType: 'tag',
    };
    // TODO tag[attr] & [attr]
    return null;
}
function processUIBindingNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const match = matchUIBindingNode(node);
    if (!match) return false;
    // 分析节点绑定和属性绑定 TODO
    // const bindings = resolveNodeBindings(node);

    const templateId = node.id;
    // TODO tag[attr] & [attr]
    constructorStack.push(function (context: INeTemplateContext) {
        const selector = match.selector;
        // metadata
        const metadata = getUIBindingMetadata(selector);
        const parentBindingRef = context.bindingRef;
        const parentInjector = context.parentInjector;
        const factory: IBindingRefFactory = {
            newInstance: (providers?: Provider[]) => {
                let injector = parentInjector || bindingInjector;
                providers && (injector = injector.create(providers));
                // binding
                const tpl = compile(metadata.template);
                const bindingRef = new NeBindingRef(tpl.constructorStack, parentBindingRef, injector);
                // injector
                const buildInProviders = buildinBindingProviders(bindingRef);
                const instance = createUIBindingInstance(selector, buildInProviders, injector);
                injectTempalateVaribles(instance, bindingRef);
                // 绑定
                bindingRef.bind(instance);
                return bindingRef;
            }
        };
        const clazz = getBindingElementClass(BindingElementTypes.ELEMENT);
        const element = new clazz(match.selector, factory);
        // 记录模板id
        templateId && (context.templateVaribles[templateId] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element.placeholder);
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.bindings.push(context.current);
        context.initializeStack.push(function (scope: INeBindingScope) {

        });
        context.destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        })
    });
    // 处理属性
    processAttributes(node, constructorStack);
    // 处理子节点
    processChildNodes(node, constructorStack);
    // 处理属性组件绑定 TODO
    // processAttrNodes(bindings.attrNodes, constructorStack);
    return true;
}
// -----------------------------------------------------------
// dynamic node
// ===========================================================
function processDynamicBindingNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    if (node.name !== 'ne-binding') return false;
    constructorStack.push(function (context: INeTemplateContext) {
        const clazz = getBindingElementClass(BindingElementTypes.DYNAMIC);
        const element = new clazz(context.bindingRef, context.parentInjector);
        // 记录模板id
        node.id && (context.templateVaribles[node.id] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element.placeholder);
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.bindings.push(context.current);
        context.initializeStack.push(function (scope: INeBindingScope) {

        });
        context.destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        });
    });
    // 处理属性
    processAttributes(node, constructorStack);
    // 处理子节点
    processChildNodes(node, constructorStack);
    return true;
}
// -----------------------------------------------------------
// logic binding node
// ===========================================================
function processLogicBindingNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    if (isEmpty(node.logics)) return false;
    // TODO 暂时一个dom上只支持一个logic
    if (node.logics['*for']) {
        processRepeatNode(node, constructorStack);
    } else if (node.logics['*if']) {
        processIfNode(node, constructorStack);
    } else {

    }
    return true;
}
// -----------------------------------------------------------
// repeat(for) node
// ===========================================================
// `*for="item in array"`
// `*for="item, index in array"`
// `*for="item, index in [0, 1, 2]"`
// `*for="[0, 1, 2]" let-item let-index="$index"`
function processRepeatNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const targetKey = '*for';
    const logicInfo = node.logics[targetKey];
    let statement = (logicInfo.statement || '').trim();
    if (statement.indexOf(' in ') !== -1) {
        let arr = statement.split(' in ');
        statement = arr[1].trim();
    }
    // 处理变量声明
    const implicitsVaribles = {};
    Object.keys(node.varibles).forEach(key => {
        implicitsVaribles[key] = composeGetter(`let-${key}`, node.varibles[key]);
    });
    delete node.logics;
    constructorStack.push(function (context: INeTemplateContext) {
        const initializeStack = context.initializeStack;
        const destroyStack = context.destroyStack;
        // 创建for element
        const stack = [];
        processNode(node, stack);
        const parentInjector = context.parentInjector;
        const bindingRef = context.bindingRef;
        const hooks: INeTemplateBindingHook = {
            markChangeDetection: function () {
                return markChangeDetection(bindingRef);
            }
        }
        const factory: IBindingRefFactory = {
            newInstance: (providers?: Provider[]) => {
                let injector = parentInjector || bindingInjector;
                providers && (injector = injector.create(providers));
                return new NeImplicitsBindingRef(stack, bindingRef, injector, hooks);
            }
        };
        const clazz = getBindingElementClass(BindingElementTypes.FOR);
        const element = new clazz(targetKey, logicInfo, implicitsVaribles, factory);
        // 记录模板id
        node.id && (context.templateVaribles[node.id] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element.placeholder);
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.logicElements.push(element);
        context.bindings.push(context.current);
        // 绑定属性变更
        const info = parseStatement(statement);
        const getter = composeGetter(targetKey, info);
        if (info.isPlainValue) {
            initializeStack.push((scope: INeBindingScope) => {
                element.setAttribute(targetKey, getter(scope));
            });
        } else {
            let previousValue;
            const setter = function (scope: INeBindingScope) {
                const value = getter(scope);
                if (previousValue !== value) {
                    previousValue = value;
                    element.setAttribute(targetKey, value);
                    return true;
                }
                return false;
            }
            // initialize
            initializeStack.push(setter);
            // 标记绑定
            context.current.bindings[targetKey] = {
                isSimpleBinding: isEmpty(info.functions),
                sourceKeys: Object.keys(info.chainProps),
                getter: getter,
                setter: setter
            }
        }
        destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        });
    });
}

// -----------------------------------------------------------
// if node
// ===========================================================
function processIfNode(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const targetKey = '*if';
    const logicInfo = node.logics[targetKey];
    delete node.logics;
    constructorStack.push(function (context: INeTemplateContext) {
        const initializeStack = context.initializeStack;
        const destroyStack = context.destroyStack;
        // 创建for element
        const stack = [];
        processNode(node, stack);
        const parentInjector = context.parentInjector;
        const bindingRef = context.bindingRef;
        const hooks: INeTemplateBindingHook = {
            markChangeDetection: function () {
                return markChangeDetection(bindingRef);
            }
        }
        const factory: IBindingRefFactory = {
            newInstance: (providers?: Provider[]) => {
                let injector = parentInjector || bindingInjector;
                providers && (injector = injector.create(providers));
                return new NeImplicitsBindingRef(stack, bindingRef, injector, hooks);
            }
        };
        const clazz = getBindingElementClass(BindingElementTypes.IF);
        const element = new clazz(targetKey, logicInfo, factory);
        // 记录模板id
        node.id && (context.templateVaribles[node.id] = element);
        context.current = {
            element: element,
            bindings: {},
        };
        if (context.parent) {
            context.parent.element.appendChild(element.placeholder);
        } else {
            context.rootElements.push(element);
        }
        context.customElements.push(element);
        context.logicElements.push(element);
        context.bindings.push(context.current);
        // 绑定属性变更
        const getter = composeGetter(targetKey, logicInfo);
        if (logicInfo.isPlainValue) {
            initializeStack.push((scope: INeBindingScope) => {
                element.setAttribute(targetKey, getter(scope));
            });
        } else {
            let previousValue;
            const setter = function (scope: INeBindingScope) {
                const value = getter(scope);
                if (previousValue !== value) {
                    previousValue = value;
                    element.setAttribute(targetKey, value);
                    return true;
                }
                return false;
            }
            // initialize
            initializeStack.push(setter);
            // 标记绑定
            context.current.bindings[targetKey] = {
                isSimpleBinding: isEmpty(logicInfo.functions),
                sourceKeys: Object.keys(logicInfo.chainProps),
                getter: getter,
                setter: setter
            }
        }
        destroyStack.push(function (scope: INeBindingScope) {
            element.destroy();
        });
    });
}