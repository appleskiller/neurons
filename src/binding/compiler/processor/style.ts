import { IHTMLASTNode } from '../parser/template';
import { INeTemplateContextFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { isEmpty, isArray } from 'neurons-utils';
import { composeCallback, invokeBindingFunction, composeGetter } from '../../common/util';
import { domapi } from '../../common/domapi';
import { BuildInsVaribles } from '../../common/enums';
import { IStatementInfo } from '../parser/statement';
import { prop2CssProp, value2CssValue } from 'neurons-dom';

export function processPlainStyles(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const styles = node.styles || {};
    if (isEmpty(styles)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        domapi.setStyles(context.current.element, styles);
    });
}

export function processStyleInputs(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const styleInputs = node.styleInputs || {};
    if (isEmpty(styleInputs)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        const elementBinding = context.current;
        const initializeStack = context.initializeStack;
        const element = elementBinding.element;
        Object.keys(styleInputs).forEach(styleName => {
            const bindingValue = styleInputs[styleName];
            const targetKey = `style.${styleName}`;
            if (isArray(bindingValue)) {
                // 动态属性绑定 [prop]: true
                const keyInfo = bindingValue[0] as IStatementInfo;
                const valueInfo = bindingValue[1];
                const keyGetter = composeGetter(targetKey, keyInfo);
                let previousKey, previousValue, setter, sourceKeys = Object.keys(keyInfo.chainProps), isSimpleBinding = isEmpty(keyInfo.functions);
                if (typeof valueInfo === 'object') {
                    // 值绑定
                    const valueGetter = composeGetter(targetKey, valueInfo);
                    sourceKeys = sourceKeys.concat(Object.keys(valueInfo.chainProps));
                    !isSimpleBinding && (isSimpleBinding = isEmpty(valueInfo.functions));
                    setter = function (scope: INeBindingScope) {
                        const key = keyGetter(scope);
                        const value = valueGetter(scope);
                        if (previousKey !== key || previousValue !== value) {
                            domapi.setStyle(element, prop2CssProp(previousKey), '');
                            previousKey = key;
                            previousValue = value;
                            domapi.setStyle(element, prop2CssProp(key), value2CssValue(key, value));
                            return true;
                        }
                        return false;
                    }
                } else {
                    // 简单值
                    const value = valueInfo as string;
                    setter = function (scope: INeBindingScope) {
                        const key = keyGetter(scope);
                        if (previousKey !== key) {
                            domapi.setStyle(element, prop2CssProp(previousKey), '');
                            previousKey = key;
                            domapi.setStyle(element, prop2CssProp(key), value2CssValue(key, value));
                            return true;
                        }
                        return false;
                    }
                }
                // initialize
                initializeStack.push(setter);
                // 标记绑定
                elementBinding.bindings[targetKey] = {
                    isSimpleBinding: isSimpleBinding,
                    sourceKeys: sourceKeys,
                    getter: null,
                    setter: setter
                }
            } else {
                // 值绑定
                const info = bindingValue as IStatementInfo;
                const getter = composeGetter(targetKey, info);
                let previousValue;
                const setter = function (scope: INeBindingScope) {
                    const value = getter(scope);
                    if (previousValue !== value) {
                        previousValue = value;
                        domapi.setStyle(element, prop2CssProp(styleName), value2CssValue(styleName, value));
                        return true;
                    }
                    return false;
                }
                // initialize
                initializeStack.push(setter);
                // 标记绑定
                elementBinding.bindings[targetKey] = {
                    isSimpleBinding: isEmpty(info.functions),
                    sourceKeys: Object.keys(info.chainProps),
                    getter: getter,
                    setter: setter
                }
            }
        })
    });
}