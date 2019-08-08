import { isDefined, isEmpty } from '../../../utils';
import { domapi } from '../common/domapi';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { composeVaribles, createBindingFunction } from '../common/util';
import { parseStatement } from './parser';

const inputRegExp = /^\[(.+?)\]$/;
const outputRegExp = /^\((.+?)\)$/;
function processObject(scope, element, binding, detectChanges, implicitsState, implicitsListeners) {
    // TODO 处理属性数量的变化
    Object.keys(binding).forEach(prop => {
        prop = (prop || '').trim();
        if (implicitsState[prop] !== binding[prop]) {
            let key = prop, isInput = false, isOutput = false;
            const inputMatch = key.match(inputRegExp);
            isInput = !!inputMatch && !!inputMatch[1];
            isInput && (key = inputMatch[1].trim());
            if (key) {
                const outputMatch = key.match(outputRegExp);
                isOutput = !!outputMatch && !!outputMatch[1];
                isOutput && (key = outputMatch[1].trim());
            }
            if (key) {
                // 如果输出, 重新绑定监听
                if (isOutput) {
                    if (implicitsListeners[prop]) {
                        implicitsListeners[prop]();
                        delete implicitsListeners[prop];
                    }
                    if (typeof binding[prop] === 'function') {
                        implicitsListeners[prop] = domapi.addEventListener(element, key, function(event) {
                            binding[prop].call(scope.context, event);
                            detectChanges();
                        });
                        implicitsState[prop] = binding[prop];
                    }
                } else {
                    // 普通属性或输入
                    // TODO class/style/attribute
                    implicitsState[prop] = binding[prop];
                    domapi.setAttribute(element, key, binding[prop]);
                }
            }
        }
    })
}
/**
 * TODO 处理状态对象的绑定 - *binding="object"
 */
export function processBinding<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    value = isDefined(value) ? value + '' : '';
    const info = parseStatement(value);
    const isEmptyChain = isEmpty(info.chainProps);
    // 如果未绑定任何属性
    if (isEmptyChain) return;
    // 展开属性绑定
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = context.current;
        const listeners = context.listeners;
        const detectChanges = context.detectChanges;
        context.initializeStack.push(function (scope: IBindingScope<T>) {
            // 创建内部监测函数
            const implicitsState = {};
            // 创建内部监听栈
            const implicitsListeners = {};
            const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
            const setter = function (scope: IBindingScope<T>, value: any) {
                if (!value || typeof value !== 'object') return;
                processObject(scope, element, value, detectChanges, implicitsState, implicitsListeners);
            }
            listeners.push(() => Object.keys(implicitsListeners).forEach(k => implicitsListeners[k]()));
            const binded = createBindingFunction(element, context.inputBindings, info, key, value, getter, setter);
            binded(scope);
        });
        context.isPlainTemplate = false;
    });
}
