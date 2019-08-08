import { isDefined, isEmpty } from '../../../utils';
import { domapi } from '../common/domapi';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { composeVaribles, createBindingFunction } from '../common/util';
import { isClassInput, processClass } from './class';
import { parseStatement } from './parser';
import { isStyleInput, processStyle } from './style';

export function processInput<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    if (isClassInput(key)) {
        processClass(key, value, constructorStack);
    } else if (isStyleInput(key)) {
        processStyle(key, value, constructorStack);
    } else {
        value = isDefined(value) ? value + '' : '';
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        // 普通属性绑定
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, v: any) {
                    if (domapi.getAttribute(element, key) !== v) {
                        domapi.setAttribute(element, key, v);
                    }
                }
                const binded = createBindingFunction(element, inputBindings, info, key, value, getter, setter);
                binded(scope);
            });
            if (!isEmptyChain) {
                context.isPlainTemplate = false;
            }
        });
    }
}