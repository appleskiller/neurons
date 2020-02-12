import { isEmpty } from 'neurons-utils';
import { IHTMLASTNode } from '../parser/template';
import { INeTemplateContextFunction, INeTemplateContext } from '../../common/interfaces';
import { domapi } from '../../common/domapi';


export function processPlainAttrs(node: IHTMLASTNode, constructorStack: INeTemplateContextFunction[]) {
    const attrs = node.attrs || {};
    if (isEmpty(attrs)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        domapi.setAttributes(context.current.element, attrs);
    });
}