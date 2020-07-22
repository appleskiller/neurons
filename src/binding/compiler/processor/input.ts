import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { isEmpty } from 'neurons-utils';
import { composeGetter, invokeBindingFunction, processPlainElementAttrs } from '../../common/util';
import { domapi } from '../../common/domapi';
import { wrapStatementParserErrorMessage, wrapBindingErrorMessage } from '../parser/error';
import { parseToClassMap, parseToStyleObject, createDocumentFragment, createElement } from 'neurons-dom';

export function processInputs(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const inputs = node.inputs || {};
    if (isEmpty(inputs)) return;
    // 包含[class]="statement"和[style]="statement"的情况
    constructorStack.push(function (context: INeTemplateContext) {
        const skipError = context.skipError;
        const elementBinding = context.current;
        const initializeStack = context.initializeStack;
        const element = elementBinding.element;
        Object.keys(inputs).forEach(targetKey => {
            const info = inputs[targetKey];
            const statement = info.statement;
            const getter = composeGetter(targetKey, info, skipError);
            // 绑定函数
            let setter;
            if (targetKey === 'class') {
                let previousClasses = {};
                setter = function (scope: INeBindingScope) {
                    let value = getter(scope);
                    let classes = {};
                    if (typeof value === 'string') {
                        value = value.trim();
                        const isJSON = value.charAt(0) === '{' && value.charAt(value.length - 1) === '}';
                        if (isJSON) {
                            try { classes = JSON.parse(value); }
                            catch (error) { throw wrapBindingErrorMessage(error, targetKey || '', statement); }
                        } else {
                            classes = parseToClassMap(value);
                        }
                    } else if (typeof value === 'object') {
                        classes = value;
                    }
                    const currentClasses = {};
                    let changed = false;
                    Object.keys(classes).forEach(className => {
                        if (previousClasses[className] !== classes[className]) {
                            if (classes[className]) {
                                domapi.addClass(element, className);
                                currentClasses[className] = true;
                            } else {
                                domapi.removeClass(element, className);
                            }
                            changed = true;
                        }
                        delete previousClasses[className];
                    });
                    Object.keys(previousClasses).forEach(className => {
                        domapi.removeClass(element, className);
                        changed = true;
                    });
                    previousClasses = currentClasses;
                    return changed;
                }
            } else if (targetKey === 'style') {
                let previousStyleSheet = {};
                setter = function (scope: INeBindingScope) {
                    let value = getter(scope);
                    let styleSheet = {};
                    if (typeof value === 'string') {
                        value = value.trim();
                        const isJSON = value.charAt(0) === '{' && value.charAt(value.length - 1) === '}';
                        if (isJSON) {
                            try { styleSheet = JSON.parse(value); }
                            catch (error) { throw wrapBindingErrorMessage(error, targetKey || '', statement); }
                        } else {
                            styleSheet = parseToStyleObject(value);
                        }
                    } else if (typeof value === 'object') {
                        styleSheet = value;
                    }
                    const currentStyleSheet = {};
                    let changed = false;
                    Object.keys(styleSheet).forEach(styleName => {
                        if (previousStyleSheet[styleName] !== styleSheet[styleName]) {
                            domapi.setStyle(element, styleName, styleSheet[styleName]);
                            currentStyleSheet[styleName] = true;
                            changed = true;
                        }
                        delete previousStyleSheet[styleName];
                    });
                    Object.keys(previousStyleSheet).forEach(styleName => {
                        domapi.setStyle(element, styleName, '');
                        changed = true;
                    });
                    previousStyleSheet = currentStyleSheet;
                    return changed;
                }
            } else {
                let previousValue;
                setter = function (scope: INeBindingScope) {
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
            }
            // initialize
            initializeStack.push(setter);
            // 标记绑定
            elementBinding.bindings[targetKey] = {
                isPlainBinding: isEmpty(info.functions),
                sourceKeys: Object.keys(info.chainProps),
                getter: getter,
                setter: setter
            }
        });
    });
}
