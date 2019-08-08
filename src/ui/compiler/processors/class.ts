import { isDefined, isEmpty } from '../../../utils';
import { parseToClassMap } from '../../../utils/domutils';
import { domapi } from '../common/domapi';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { composeVaribles, createBindingFunction, invokeInputInBindingObject, parseSimpleValue } from '../common/util';
import { parseStatement } from './parser';

export function isClassInput(key: string): boolean {
    return key === 'class' || key.indexOf('class.') !== -1;
}

const inputRegExp = /^\[(.+?)\]$/;
// function continueBinding<T>(element, scope: IBindingScope<T>, key: string, value, inputBindings, updateStack, invokeControl) {
//     if (key) {
//         const info = parseJsonStatement(value);
//         const isEmptyChain = isEmpty(info.chainProps);
//         const cancelFunction = function () {
//             return invokeControl.cancelFunction();
//         }
//         const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
//         const setter = function (scope: IBindingScope<T>, v: boolean) {
//             if (v) {
//                 domapi.addClass(element, key);
//             } else {
//                 domapi.removeClass(element, key);
//             }
//         }
//         const compare = function (scope: IBindingScope<T>, newValue: boolean): boolean {
//             return domapi.hasClass(element, key) !== newValue;
//         }
//         const targetKey = `class.${key}`;
//         const binded = createBindingFunction(element, inputBindings, info, targetKey, value, getter, setter, compare, cancelFunction);
//         return {
//             statementInfo: info,
//             binded: binded,
//             targetKey: targetKey
//         };
//     }
//     return null;
// }
export function processClass<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    if (!isDefined(value)) return;
    value = (value + '').trim();
    if (!value) return;
    let isClassProp = false;
    if (key.indexOf('class.') !== -1) {
        key = key.substr(6);
        isClassProp = true;
    }
    let previousClasses = {};
    if (value.charAt(0) === '{') {
        // [class]="{'name': value, [prop]: statement}"
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, value: any) {
                    const currentClasses = {};
                    Object.keys(value).forEach(className => {
                        if (previousClasses[className] !== value[className]) {
                            if (value[className]) {
                                domapi.addClass(element, className);
                                currentClasses[className] = true;
                            } else {
                                domapi.removeClass(element, className);
                            }
                        }
                        delete previousClasses[className];
                    });
                    Object.keys(previousClasses).forEach(className => domapi.removeClass(element, className));
                    previousClasses = currentClasses;
                }
                const binded = createBindingFunction(element, inputBindings, info, key, value, getter, setter);
                binded(scope);
            });
            if (!isEmptyChain) {
                context.isPlainTemplate = false;
            }
        });
    } else if (isClassProp){
        // [class.className]="statement"
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                let previousValue;
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, classValue: boolean) {
                    if (previousValue !== classValue) {
                        previousValue = classValue;
                        if (classValue){
                            domapi.addClass(element, key);
                        } else {
                            domapi.removeClass(element, key);
                        }
                    }
                }
                const targetKey = `class.${key}`;
                const binded = createBindingFunction(element, inputBindings, info, targetKey, value, getter, setter);
                binded(scope);
            });
            if (!isEmptyChain) {
                context.isPlainTemplate = false;
            }
        });
    } else {
        // [class]="prop"
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, classValue: any) {
                    const currentClasses = {};
                    if (classValue && typeof classValue === 'object') {
                        // prop is object
                        Object.keys(classValue).forEach(className => {
                            let value = classValue[className];
                            // 执行属性输入绑定
                            const classSetter = function(scope, v) {
                                if (previousClasses[className] !== v) {
                                    if (v) {
                                        domapi.addClass(element, className);
                                        currentClasses[className] = true;
                                    } else {
                                        domapi.removeClass(element, className);
                                    }
                                }
                            }
                            const inputMatch = className.match(inputRegExp);
                            const isInput = !!inputMatch && !!inputMatch[1];
                            isInput && (className = inputMatch[1].trim());
                            if (isInput) {
                                invokeInputInBindingObject(scope, className, value, classSetter);
                            } else {
                                classSetter(scope, parseSimpleValue(value));
                            }
                            delete previousClasses[className];
                        })
                    } else {
                        // prop is string
                        const classes = parseToClassMap(classValue);
                        Object.keys(classes).forEach(className => {
                            if (previousClasses[className] !== classes[className]) {
                                if (classes[className]) {
                                    domapi.addClass(element, className);
                                    currentClasses[className] = true;
                                } else {
                                    domapi.removeClass(element, className);
                                }
                            }
                            delete previousClasses[className];
                        })
                    }
                    Object.keys(previousClasses).forEach(className => domapi.removeClass(element, className));
                    previousClasses = currentClasses;
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