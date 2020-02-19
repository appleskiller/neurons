
import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext, INeBindingScope } from '../../common/interfaces';
import { nativeApi } from '../../common/domapi';
import { isEmpty } from 'neurons-utils';
import { composeGetter, invokeBindingFunction } from '../../common/util';

const contentExpresionRegexp = /\{\{(.+?)\}\}/;
export function processContent(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const contents = typeof node.contents === 'string' ? [node.contents] : (node.contents || []);
    if (!contents.length) return;
    // binding
    constructorStack.push(function (context: INeTemplateContext) {
        context.current = {
            element: null,
            bindings: {},
        };
        context.bindings.push(context.current);
    });
    // text
    contents.forEach((text, index) => {
        if (typeof text === 'object') {
            const statement = text.statement;
            constructorStack.push(function (context: INeTemplateContext) {
                const elementBinding = context.current;
                const initializeStack = context.initializeStack;
                const element = nativeApi.createTextNode('');
                if (context.parent) {
                    context.parent.element.appendChild(element);
                } else {
                    context.rootElements.push(element);
                }
                // 绑定函数
                const targetKey = `content[${index}]`;
                const getter = composeGetter(targetKey, text);
                let previousValue;
                const setter = function(scope: INeBindingScope) {
                    const value = getter(scope);
                    if (previousValue !== value) {
                        previousValue = value;
                        nativeApi.replaceData(element, 0, element.data.length, value);
                        return true;
                    }
                    return false;
                }
                // initialize
                initializeStack.push(setter);
                // 标记绑定
                elementBinding.bindings[targetKey] = {
                    isPlainBinding: isEmpty(text.functions),
                    sourceKeys: Object.keys(text.chainProps),
                    getter: getter,
                    setter: setter
                }
            });
        } else {
            constructorStack.push(function (context: INeTemplateContext) {
                const element = nativeApi.createTextNode(text);
                if (context.parent) {
                    context.parent.element.appendChild(element);
                } else {
                    context.rootElements.push(element);
                }
            });
        }
    })
}
