import { isEmpty } from 'neurons-utils';
import { IHTMLASTNode } from '../parser/template';
import { INeTemplateCompileFunction, INeTemplateContext } from '../../common/interfaces';
import { domapi } from '../../common/domapi';


export function processPlainAttrs(node: IHTMLASTNode, constructorStack: INeTemplateCompileFunction[]) {
    const attrs = node.attrs || {};
    if (isEmpty(attrs)) return;
    constructorStack.push(function (context: INeTemplateContext) {
        domapi.setAttributes(context.current.element, attrs);
    });
}