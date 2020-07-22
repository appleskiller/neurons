import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { isEmpty, isArray } from 'neurons-utils';
import { composeCallback, invokeBindingFunction, composeGetter } from '../../common/util';
import { domapi } from '../../common/domapi';
import { BuildInsVaribles } from '../../common/enums';
import { IStatementInfo } from '../parser/statement';

export function processPlainClasses(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const classes = node.classes || {};
    if (isEmpty(classes)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        domapi.setClasses(context.current.element, classes);
    });
}

export function processClassInputs(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const classInputs = node.classInputs || {};
    if (isEmpty(classInputs)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        const skipError = context.skipError;
        const elementBinding = context.current;
        const initializeStack = context.initializeStack;
        const element = elementBinding.element;
        Object.keys(classInputs).forEach(className => {
            const bindingValue = classInputs[className];
            const targetKey = `class.${className}`;
            if (isArray(bindingValue)) {
                // 动态属性绑定 [prop]: true
                const keyInfo = bindingValue[0] as IStatementInfo;
                const valueInfo = bindingValue[1];
                const keyGetter = composeGetter(targetKey, keyInfo, skipError);
                let previousKey, previousValue, setter, sourceKeys = Object.keys(keyInfo.chainProps), isPlainBinding = isEmpty(keyInfo.functions);
                if (typeof valueInfo === 'object') {
                    // 值绑定
                    const valueGetter = composeGetter(targetKey, valueInfo, skipError);
                    sourceKeys = sourceKeys.concat(Object.keys(valueInfo.chainProps));
                    !isPlainBinding && (isPlainBinding = isEmpty(valueInfo.functions));
                    setter = function (scope: INeBindingScope) {
                        const key = keyGetter(scope);
                        const value = valueGetter(scope);
                        if (previousKey !== key || previousValue !== value) {
                            previousKey && domapi.removeClass(element, previousKey);
                            previousKey = key;
                            previousValue = value;
                            value ? domapi.addClass(element, key) : domapi.removeClass(element, key);
                            return true;
                        }
                        return false;
                    }
                } else {
                    // 简单值
                    if (!!valueInfo) {
                        setter = function (scope: INeBindingScope) {
                            const key = keyGetter(scope);
                            if (previousKey !== key) {
                                previousKey && domapi.removeClass(element, previousKey);
                                previousKey = key;
                                domapi.addClass(element, key)
                                return true;
                            }
                            return false;
                        }
                    }
                }
                if (setter) {
                    // initialize
                    initializeStack.push(setter);
                    // 标记绑定
                    elementBinding.bindings[targetKey] = {
                        isPlainBinding: isPlainBinding,
                        sourceKeys: sourceKeys,
                        setter: setter,
                        getter: null
                    }
                }
            } else {
                // 值绑定
                const info = bindingValue as IStatementInfo;
                const getter = composeGetter(targetKey, info, skipError);
                let previousValue;
                const setter = function (scope: INeBindingScope) {
                    const value = getter(scope);
                    if (previousValue !== value) {
                        previousValue = value;
                        value ? domapi.addClass(element, className) : domapi.removeClass(element, className);
                        return true;
                    }
                    return false;
                }
                // initialize
                context.initializeStack.push(setter);
                // 标记绑定
                elementBinding.bindings[targetKey] = {
                    isPlainBinding: isEmpty(info.functions),
                    sourceKeys: Object.keys(info.chainProps),
                    getter: getter,
                    setter: setter,
                }
            }
        })
    });
}