import { IXMLASTNode } from '../../../utils/xmlutils';
import { TemplateContextFunction, ITemplateContext } from '../common/interfaces';
import { domapi, nativeApi } from '../common/domapi';

export function processTag<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    const tagName = node.name;
    const xmlns = node.xmlns;
    constructorStack.push(function (context: ITemplateContext<T>) {
        const element = nativeApi.createElement(tagName, '', null, xmlns);
        if (context.parent) {
            if (context.parent instanceof Node) {
                nativeApi.appendChild(context.parent, element);
            } else {
                context.parent.appendChild(element);
            }
        } else {
            context.rootElements.push(element);
        }
        context.current = element;
    });
}
