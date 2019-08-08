import { isDefined, isEmpty } from '../../../utils';
import { parseToStyleObject } from '../../../utils/domutils';
import { domapi } from '../common/domapi';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { composeVaribles, createBindingFunction, invokeInputInBindingObject } from '../common/util';
import { parseStatement } from './parser';

export function isStyleInput(key: string): boolean {
    return key === 'style' || key.indexOf('style.') !== -1;
}
const inputRegExp = /^\[(.+?)\]$/;
// function continueBinding<T>(element, scope: IBindingScope<T>, key: string, value, inputBindings, updateStack, invokeControl) {
//     if (key) {
//         const info = parseStatement(value);
//         const isEmptyChain = isEmpty(info.chainProps);
//         const cancelFunction = function () {
//             return invokeControl.cancelFunction();
//         }
//         const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
//         const setter = function (scope: IBindingScope<T>, v: any) {
//             domapi.setStyle(element, key, v);
//         }
//         const compare = function (scope: IBindingScope<T>, newValue: any): boolean {
//             return domapi.getStyle(element, key) !== newValue;
//         }
//         const binded = createBindingFunction(inputBindings, info, getter, setter, key, value, cancelFunction);
//         if (!isEmptyChain) {
//             updateStack.push(binded);
//         }
//         return {
//             statementInfo: info,
//             binded: binded
//         };
//     }
//     return null;
// }

export function processStyle<T>(key: string, value: string, constructorStack: TemplateContextFunction<T>[]) {
    if (!isDefined(value)) return;
    value = (value + '').trim();
    if (!value) return;
    let isStyleProp = false;
    if (key.indexOf('style.') !== -1) {
        key = key.substr(6);
        isStyleProp = true;
    }
    let previousStyleSheet = {};
    if (value.charAt(0) === '{') {
        // [style]="{'name': value, [prop]: statement}"
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const inputBindings = context.inputBindings;
            const updateStack = context.updateStack;
            const element = context.current;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, styleSheet: any) {
                    const currentStyleSheet = {};
                    Object.keys(styleSheet).forEach(styleName => {
                        if (previousStyleSheet[styleName] !== styleSheet[styleName]) {
                            domapi.setStyle(element, styleName, styleSheet[styleName]);
                            currentStyleSheet[styleName] = true;
                        }
                        delete previousStyleSheet[styleName];
                    });
                    Object.keys(previousStyleSheet).forEach(styleName => domapi.setStyle(element, styleName, ''));
                    previousStyleSheet = currentStyleSheet;
                }
                const binded = createBindingFunction(element, inputBindings, info, key, value, getter, setter);
                binded(scope);
            });
            if (!isEmptyChain) {
                context.isPlainTemplate = false;
            }
        });
    } else if (isStyleProp) {
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                let previousValue;
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, styleValue: any) {
                    if (previousValue !== styleValue) {
                        previousValue = styleValue;
                        domapi.setStyle(element, key, styleValue);
                    }
                }
                const targetKey = `style.${key}`;
                const binded = createBindingFunction(element, inputBindings, info, targetKey, value, getter, setter);
                binded(scope);
            });
            if (!isEmptyChain) {
                context.isPlainTemplate = false;
            }
        });
    } else {
        const info = parseStatement(value);
        const isEmptyChain = isEmpty(info.chainProps);
        constructorStack.push(function (context: ITemplateContext<T>) {
            const element = context.current;
            const inputBindings = context.inputBindings;
            const updateStack = context.updateStack;
            context.initializeStack.push(function (scope: IBindingScope<T>) {
                const getter = new Function('', `${composeVaribles(info, scope.implicits)}\nreturn (${value})`);
                const setter = function (scope: IBindingScope<T>, styleValue: any) {
                    // [style]="prop"
                    const currentStyleSheet = {};
                    if (styleValue && typeof styleValue === 'object') {
                        // prop is object
                        Object.keys(styleValue).forEach(styleName => {
                            const value = styleValue[styleName];
                            // 执行属性输入绑定
                            const styleSetter = function(scope, v) {
                                if (previousStyleSheet[styleName] !== v) {
                                    domapi.setStyle(element, styleName, v);
                                    currentStyleSheet[styleName] = v;
                                }
                            }
                            const inputMatch = styleName.match(inputRegExp);
                            const isInput = !!inputMatch && !!inputMatch[1];
                            isInput && (styleName = inputMatch[1].trim());
                            if (isInput) {
                                invokeInputInBindingObject(scope, styleName, value, styleSetter);
                            } else {
                                styleSetter(scope, value);
                            }
                            delete previousStyleSheet[styleName];
                        });
                    } else {
                        // prop is string
                        const styleSheet = parseToStyleObject(styleValue);
                        Object.keys(styleSheet).forEach(styleName => {
                            if (previousStyleSheet[styleName] !== styleSheet[styleName]) {
                                domapi.setStyle(element, styleName, styleSheet[styleName]);
                                currentStyleSheet[styleName] = true;
                            }
                            delete previousStyleSheet[styleName];
                        })
                    }
                    Object.keys(previousStyleSheet).forEach(styleName => domapi.setStyle(element, styleName, ''));
                    previousStyleSheet = currentStyleSheet;
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