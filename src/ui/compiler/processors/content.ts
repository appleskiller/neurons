import { isEmpty } from '../../../utils';
import { IXMLASTNode } from '../../../utils/xmlutils';
import { nativeApi } from '../common/domapi';
import { IBindingScope, ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { composeVaribles, createBindingFunction, processNormalTextContent } from '../common/util';
import { parseStatement } from './parser';


const contentExpresionRegexp = /\{\{(.+?)\}\}/;
export function processContent<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    let content = node.content || '';
    const contents = [];
    while(content) {
        const match = content.match(contentExpresionRegexp);
        if (match) {
            const index = match.index;
            let preText = content.substring(0, index);
            content = content.substr(index + match[0].length);
            const info = parseStatement(match[1] || '');
            if (!isEmpty(info.chainProps) || !isEmpty(info.varibles)) {
                preText && contents.push(preText);
                contents.push(info);
            } else {
                preText += match[1] || '';
                preText && contents.push(preText);
            }
        } else {
            break;
        }
    }
    content && contents.push(content);
    contents.forEach((text, index) => {
        if (typeof text === 'object') {
            const statement = text.statement;
            const isEmptyChain = isEmpty(text.chainProps);
            constructorStack.push(function (context: ITemplateContext<T>) {
                const element = nativeApi.createTextNode('');
                if (context.parent) {
                    if (context.parent instanceof Node) {
                        nativeApi.appendChild(context.parent, element);
                    } else {
                        context.parent.appendChild(element);
                    }
                } else {
                    context.rootElements.push(element);
                }
                context.initializeStack.push(function(scope: IBindingScope<T>) {
                    let previousValue;
                    const getter = new Function('', `${composeVaribles(text, scope.implicits)}\nreturn (${statement})`);
                    const setter = function (scope: IBindingScope<T>, v: any) {
                        if (previousValue !== v) {
                            previousValue = v;
                            nativeApi.replaceData(element, 0, element.data.length, v);
                        }
                    }
                    const binded = createBindingFunction(element, context.inputBindings, text, `*content.${index}`, statement, getter, setter);
                    binded(scope);
                });
                if (!isEmptyChain) {
                    context.isPlainTemplate = false;
                }
            });
        } else {
            processNormalTextContent(text, constructorStack);
        }
    })
}
