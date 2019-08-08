import { TemplateContextFunction, ITemplateContext, IBindingScope, IInputBindings, BindFunction, ICustomElement } from './interfaces';
import { isDefined, isEmpty, ObjectAccessor, uniqueId } from '../../../utils';
import { domapi, nativeApi } from './domapi';
import { IStatementInfo, parseStatement } from '../processors/parser';
import { BuildInsVaribles } from './enums';
import { processBindingErrorMessage } from '../processors/error';
import { parseToClassMap, parseToStyleObject } from '../../../utils/domutils';

export function callDynamicFunction(func, context, extraVaribles?) {
    if (!extraVaribles) {
        return func.call(context);
    } else {
        return func.call(context, extraVaribles);
    }
}

export function composeVaribles(info: IStatementInfo, scopeVaribles?, includes?: string[]) {
    includes = includes || [];
    scopeVaribles = scopeVaribles || {};
    const funcs = Object.keys(info.functions);
    const buildIns = [];
    const vars = [];
    Object.keys(info.varibles).forEach(key => {
        if (BuildInsVaribles[key] || (key in scopeVaribles)) {
            buildIns.push(key);
        } else {
            vars.push(key);
        }
    })
    includes.forEach(key => {
        if (BuildInsVaribles[key]) {
            buildIns.push(key);
        } else {
            vars.push(key);
        }
    })
    if (!buildIns.length && !vars.length && !funcs.length) return '';
    // 处理额外的变量
    let result = '';
    if (funcs.length) {
        const funcPre = 'var __THAT__ = this;';
        const functions = funcs.map(name => {
            return `var ${name} = function () {
    return __THAT__.${name}.apply(__THAT__, arguments);
};`
        }).join('\n');
        result = `${result}\n${funcPre}\n${functions}`;
    }
    if (buildIns.length) {
        const buildInPre = 'var __BUILD_IN__ = arguments[0] || {};';
        const buildIn = buildIns.map(name => {
            return `var ${name} = __BUILD_IN__.${name};`;
        }).join('\n');
        result = `${result}\n${buildInPre}\n${buildIn}`;
    }
    if (vars.length) {
        const varibles = vars.map(v => {
            return `var ${v} = this.${v};`
        }).join(';');
        result = `${result}\n${varibles}`;
    }
    return result;
}

export function composeCallFunction(info: IStatementInfo, scopeVaribles, statement) {
    let body = `${composeVaribles(info, scopeVaribles)}\n${statement};`;
    scopeVaribles = scopeVaribles || {};
    const vars = [];
    Object.keys(info.varibles).forEach(key => {
        if (!BuildInsVaribles[key] && !(key in scopeVaribles)) {
            vars.push(key);
        }
    });
    // if (vars.length) {
    //     const receiveVaribles = vars.map(v => {
    //         return `this.${v} = ${v};`
    //     }).join(';');
    //     body = `${body}\n${receiveVaribles}`;
    // }
    return body;
}

export function composeTwoWayBindFunction(info: IStatementInfo, scopeVaribles, statement) {
    // 创建双向绑定输出语句
    // 如果语句即变量，在双向绑定赋值完成后检查是否存在同名输入，如果存在则自动发出通知
    let trigger = '', assignment = '';
    if (info.varibles[statement]) {
        trigger = `
    if (this.${statement}Change && typeof this.${statement}Change.emit === 'function') {
        this.${statement}Change.emit(this.${statement});
    }`;
    assignment = `if (this.${statement} !== __BUILD_IN__.$event) {
    this.${statement} = __BUILD_IN__.$event;\n${trigger};
}`
    } else {
    assignment = `if (${statement} !== __BUILD_IN__.$event) {
    ${statement} = __BUILD_IN__.$event;\n${trigger};
}`
    }
    let body = `${composeVaribles(info, scopeVaribles, ['$event'])}\n${assignment};`;
    return body;
}

function getVarible(chain) {
    let i = chain.indexOf('.');
    if (i !== -1) {
        chain = chain.substring(0, i);
    }
    return chain;
}

export function composeChainPropertyBindings<T>(
    type: 'input' | 'output',
    element: HTMLElement | Element | Node | ICustomElement<T>,
    inputBindings: IInputBindings<T>,
    chains,
    targetKey,
    bindingFunc
) {
    const isEmptyChain = isEmpty(chains);
    if (!isEmptyChain) {
        Object.keys(chains).forEach(key => {
            if (!inputBindings.chains[key]) {
                inputBindings.chains[key] = {
                    chainProp: key,
                    varible: getVarible(key),
                    previousValue: undefined,
                    inputs: [],
                    outputs: []
                };
            }
            const bindings = (type === 'output') ? inputBindings.chains[key].outputs : inputBindings.chains[key].inputs;
            let index = bindings.findIndex(b => (b.element === element && b.targetKey === targetKey));
            if (index === -1) {
                bindings.push({
                    element: element,
                    targetKey: targetKey,
                });
                index = bindings.length - 1;
            }
            if (type === 'output') {
                bindings[index]['binding'] = bindingFunc;
            }
        })
    }
}
export function dropInputBindings<T>(
    type: 'input' | 'output',
    element: HTMLElement | Element | ICustomElement<T>,
    inputBindings: IInputBindings<T>,
    info: IStatementInfo,
    targetKey: string
) {
    if (info.chainProps && !isEmpty(info.chainProps)) {
        Object.keys(info.chainProps).forEach(key => {
            const chains = inputBindings.chains[key];
            if (chains) {
                const bindings = (type === 'output') ? inputBindings.chains[key].outputs : inputBindings.chains[key].inputs;
                let index = bindings.findIndex(b => (b.element === element && b.targetKey === targetKey));
                if (index !== -1) {
                    bindings.splice(index, 1);
                    if (!inputBindings.chains[key].outputs.length && !inputBindings.chains[key].inputs.length) {
                        delete inputBindings.chains[key];
                    }
                }
            }
        })
    }
}

export function invokeBindingGetter<T>(getter, scope: IBindingScope<T>, targetKey: string, statement: string) {
    let v;
    try {
        v = callDynamicFunction(getter, scope.context, scope.implicits);
    } catch (error) {
        throw new Error(processBindingErrorMessage(error, targetKey || '', statement));
    }
    return v;
}

export function cancelInvokeBindingFunction() {
    return true;
}
export function performInvokeBindingFunction() {
    return false;
}

export function createBindingFunction<T>(
    element: HTMLElement | Element | Node | ICustomElement<T>,
    inputBindings: IInputBindings<T>,
    info: IStatementInfo,
    targetKey: string, statement: string,
    getter: Function,
    setter: (scope, newValue: any) => void,
    cancelFunction?: () => boolean
): BindFunction<T> {
    cancelFunction = cancelFunction || performInvokeBindingFunction;
    const bindingFunc = function<T>(scope: IBindingScope<T>) {
        if (cancelFunction() !== true) {
            const value = invokeBindingGetter(getter, scope, targetKey, statement);
            setter(scope, value);
            return true;
        }
        return false
    }
    composeChainPropertyBindings('input', element, inputBindings, info.chainProps, targetKey, bindingFunc);
    inputBindings.inputs.push(bindingFunc);
    return bindingFunc;
}

export function invokeInputInBindingObject<T>(scope: IBindingScope<T>, key: string, statement, setter) {
    if (key) {
        const info = parseStatement(statement);
        const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${statement})`);
        const v = invokeBindingGetter(getter, scope, key, statement);
        setter(scope, v);
        return true;
    }
    return false;
}

const simpleValueMapping = {
    'undefined': undefined,
    'null': null,
    'NaN': NaN,
    'true': true,
    'false': false,
}

export function parseSimpleValue(value: string) {
    if (value in simpleValueMapping) {
        return simpleValueMapping[value];
    }
    if (!value) return value;
    // number
    const num = parseFloat(value);
    if ((num + '') === value) {
        return num;
    }
    return value;
}

export function processNormalAttribute<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    value = isDefined(value) ? value : '';
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = context.current;
        if (key === 'class') {
            // prop is string
            const classes = parseToClassMap(value);
            Object.keys(classes).forEach(className => {
                if (classes[className]) {
                    domapi.addClass(element, className);
                } else {
                    domapi.removeClass(element, className);
                }
            });
        } else if (key === 'style') {
            // prop is string
            const styleSheet = parseToStyleObject(value);
            Object.keys(styleSheet).forEach(styleName => {
                domapi.setStyle(element, styleName, styleSheet[styleName]);
            })
        } else {
            domapi.setAttribute(element, key, value)
        }
    });
}
export function processNormalStyle<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    value = isDefined(value) ? value : '';
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = context.current;
        domapi.setStyle(element, key, value);
    });
}
export function processNormalTextContent<T>(text: string, constructorStack: TemplateContextFunction<T>[]) {
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = nativeApi.createTextNode(text);
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element);
            } else {
                context.parent.appendChild(element);
            }
        } else {
            context.rootElements.push(element);
        }
    });
}
