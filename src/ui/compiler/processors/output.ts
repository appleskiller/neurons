import { isDefined, isEmpty } from '../../../utils';
import { domapi } from '../common/domapi';
import { BuildInsVaribles } from '../common/enums';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { callDynamicFunction, composeCallFunction, composeChainPropertyBindings, composeTwoWayBindFunction } from '../common/util';
import { parseStatement } from './parser';

export function processOutput<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[], twoWayBind: boolean = false) {
    value = isDefined(value) ? value + '' : '';
    if (!!value) {
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        // 普通属性绑定
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const listeners = context.listeners;
            const detectChanges = context.detectChanges;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                let listener;
                const setter = twoWayBind 
                    ? new Function('', composeTwoWayBindFunction(info, scope.implicits, value))
                    : new Function('', composeCallFunction(info, scope.implicits, value));
                const binded = function(scope: IBindingScope<T>) {
                    // 重新绑定监听
                    if (listener) {
                        listener();
                        const index = listeners.indexOf(listener);
                        if (index !== -1) {
                            listeners.splice(index, 1);
                        }
                    }
                    const handler = function(event) {
                        callDynamicFunction(setter, scope.context, {
                            ...(scope.implicits || {}),
                            [BuildInsVaribles.$event]: event
                        });
                        detectChanges();
                    };
                    listener = domapi.addEventListener(element, key, handler);
                    listeners.push(listener);
                };
                if (!isEmptyChain) {
                    // 输出绑定需要补充进输入绑定检测中，以便能够在实际函数变化后重新绑定
                    composeChainPropertyBindings('output', element, inputBindings, info.chainProps, key, binded);
                }
                binded(scope);
            });
            if (!isEmpty(info.chainProps)) {
                context.isPlainTemplate = false;
            }
        });
    }
}

