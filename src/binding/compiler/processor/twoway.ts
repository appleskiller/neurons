import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { isEmpty } from 'neurons-utils';
import { composeCallback, invokeBindingFunction, composeGetter, processPlainElementAttrs, processPlainElementEvent } from '../../common/util';
import { BuildInsVaribles } from '../../common/enums';
import { domapi } from '../../common/domapi';

export function processTwoWays(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const twoWays = node.twoWays || {};
    if (isEmpty(twoWays)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        const elementBinding = context.current;
        const initializeStack = context.initializeStack;
        const element = elementBinding.element;
        const listeners = context.listeners;
        const bindingRef = context.bindingRef;
        const markChangeDetection = context.markChangeDetection;
        Object.keys(twoWays).forEach(targetKey => {
            const info = twoWays[targetKey];
            const statement = info.statement;
            const getter = composeGetter(targetKey, info);
            const callback = composeCallback(targetKey, info);
            let listener, previousValue;
            const setter = function (scope: INeBindingScope) {
                const value = getter(scope);
                if (previousValue !== value) {
                    previousValue = value;
                    // 特殊处理innerHTML属性
                    if (element instanceof Node) {
                        processPlainElementAttrs(element, targetKey, value);
                    } else {
                        element.setAttribute(targetKey, value);
                    }
                    return true;
                }
                return false;
            }
            const bindingCallback = function (scope: INeBindingScope) {
                // 绑定监听
                if (listener) {
                    listener();
                    const index = listeners.indexOf(listener);
                    if (index !== -1) {
                        listeners.splice(index, 1);
                    }
                }
                const handler = function (event) {
                    const _scope = {
                        ...scope,
                        implicits: {
                            ...(scope.implicits || {}),
                            [BuildInsVaribles.$event]: event
                        }
                    };
                    const invokeDetectChange = markChangeDetection();
                    callback(_scope);
                    invokeDetectChange();
                }
                listener = processPlainElementEvent(element, targetKey, handler);
                listeners.push(listener);
            }
            // initialize
            initializeStack.push(function (scope: INeBindingScope) {
                setter(scope);
                bindingCallback(scope);
            });
            // 标记绑定
            elementBinding.bindings[targetKey] = {
                isPlainBinding: isEmpty(info.functions),
                sourceKeys: Object.keys(info.chainProps),
                getter: getter,
                setter: setter,
            }
        });
    });
}
