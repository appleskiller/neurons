import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { isEmpty } from 'neurons-utils';
import { composeCallback, invokeBindingFunction, processPlainElementEvent } from '../../common/util';
import { domapi } from '../../common/domapi';
import { BuildInsVaribles } from '../../common/enums';

export function processOutputs(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const outputs = node.outputs || {};
    if (isEmpty(outputs)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        const skipError = context.skipError;
        const elementBinding = context.current;
        const initializeStack = context.initializeStack;
        const element = elementBinding.element;
        const listeners = context.listeners;
        const bindingRef = context.bindingRef;
        const markChangeDetection = context.markChangeDetection;
        Object.keys(outputs).forEach(targetKey => {
            const info = outputs[targetKey];
            const statement = info.statement;
            const callback = composeCallback(targetKey, info, skipError);
            let listener;
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
            initializeStack.push(bindingCallback);
            // 属性变更后进行重新注册
            // context.current.bindings[targetKey] = {
            //     isPlainBinding: isEmpty(info.functions),
            //     sourceKeys: Object.keys(info.chainProps),
            //     getter: null,
            //     setter: bindingCallback
            // }
        })
    });
}
