import { IXMLASTNode } from '../../../utils/xmlutils';
import { ITemplateContext, TemplateContextFunction } from '../common/interfaces';
import { processInput } from './input';
import { processOutput } from './output';
import { processBinding } from './binding';
import { processNormalAttribute } from '../common/util';


// TODO escape | pipe | logic | custom attribute

const inputRegExp = /^\[(.+?)\]$/;
const outputRegExp = /^\((.+?)\)$/;
export function processAttrs<T>(node: IXMLASTNode, constructorStack: TemplateContextFunction<T>[]) {
    const attrs = node.attrs || {};
    const keys = Object.keys(attrs);
    keys.forEach(key => {
        let value = attrs[key];
        key = key.trim();
        if (key) {
            const sign = key.charAt(0);
            // 处理id
            if (sign === '#') {
                key = key.substr(1).trim();
                if (key) {
                    constructorStack.push(function (context: ITemplateContext<T>) {
                        context.templateVaribles[key] = context.current;
                    });
                }
            } else if (sign === '*') {
                // 处理自动绑定
                if (key === '*binding') {
                    processBinding(key, value, constructorStack);
                } else {
                    // TODO others
                }
            } else {
                let isInput = false, isOutput = false;
                const inputMatch = key.match(inputRegExp);
                isInput = !!inputMatch && !!inputMatch[1];
                isInput && (key = inputMatch[1].trim());
                if (key) {
                    const outputMatch = key.match(outputRegExp);
                    isOutput = !!outputMatch && !!outputMatch[1];
                    isOutput && (key = outputMatch[1].trim());
                }
                if (key) {
                    // 绑定输入
                    if (isInput) {
                        processInput(key, value, constructorStack);
                    }
                    // 绑定输出
                    if (isOutput) {
                        processOutput(key, value, constructorStack, isInput);
                    }
                    // 普通属性
                    if (!isInput && !isOutput) {
                        processNormalAttribute(key, value, constructorStack);
                    }
                }
            }
        }
    });
}
