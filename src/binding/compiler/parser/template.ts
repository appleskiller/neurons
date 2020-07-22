

import { Parser } from 'htmlparser2/lib/Parser'
import { parseStatement, IStatementInfo } from './statement';
import { isEmpty, isDefined } from 'neurons-utils';
import { parseToClassMap, parseToStyleObject, cssProp2Prop } from 'neurons-dom';
import { wrapStatementParserErrorMessage } from './error';
import { string2Boolean } from './util';

export enum HTMLASTNodeType {
    'ROOT' = 1, // root node
    'DIRECTIVE' = 2, // <?xml or <!DOCTYPE or others
    'TAG' = 3,
    'TEXT' = 4,
    'COMMENT' = 5,
    // 特殊的属性节点标记，出现在node的扩展构造场景中
    'ATTRIBUTE' = 6,
}

export type IDynamicClassInput = [IStatementInfo, boolean | IStatementInfo];
export type IDynamicStyleInput = [IStatementInfo, string | IStatementInfo];

export interface IHTMLASTNode {
    type: HTMLASTNodeType;
    startIndex: number;
    endIndex: number;
    
    parentNode?: IHTMLASTNode;
    childNodes?: IHTMLASTNode[];

    id?: string;
    name?: string;
    xmlns?: string;
    content?: string;
    attrs?: { [key: string]: string };
    classes?: { [key: string]: boolean };
    styles?: { [key: string]: string };
    // class绑定
    classInputs?: { [key: string]: IStatementInfo | IDynamicClassInput };
    // style绑定
    styleInputs?: { [key: string]: IStatementInfo | IDynamicStyleInput };
    // 输入绑定
    // 包含[class]="statement"和[style]="statement"的情况
    inputs?: { [key: string]: IStatementInfo };
    // 输出绑定
    outputs?: { [key: string]: IStatementInfo };
    // 双向绑定
    twoWays?: { [key: string]: IStatementInfo };
    // 文本内容绑定
    contents?: string | (string | IStatementInfo)[];
    // 逻辑绑定
    logics?: { [key: string]: IStatementInfo };
    // 模板变量声明 let-xxx="statement"
    varibles?: { [key: string]: IStatementInfo };
}

export interface IHTMLASTRoot {
    type: HTMLASTNodeType;
    startIndex: number;
    endIndex: number;
    childNodes: IHTMLASTNode[];
}

/**
 * Parses xml
 * @param content 
 * @param [hifi] High Fidelity. default false.
 * @returns IHTMLASTNode 
 */
export function parseHTML(content: string): IHTMLASTRoot {
    content = content || '';
    const result: IHTMLASTRoot = {
        type: HTMLASTNodeType.ROOT,
        startIndex: 0,
        endIndex: content.length - 1,
        childNodes: [],
    };
    let parent: any = result;
    let current;
    let underSVGNamespacing = false;
    const parser = new Parser({
        onprocessinginstruction: function (name, data) {
            // skip
        },
        onopentag: function (name, attribs) {
            current = parseNode({
                type: HTMLASTNodeType.TAG,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                name: name,
                parentNode: parent,
                attrs: attribs || {},
                childNodes: []
            });
            if (name === 'svg') {
                current.xmlns = current.attrs.xmlns || parent.xmlns || 'http://www.w3.org/2000/svg';
            } else {
                parent.xmlns && (current.xmlns = parent.xmlns)
            }
            parent.childNodes.push(current);
            // enter
            parent = current;
        },
        onclosetag: function () {
            // exit
            parent = parent.parentNode;
        },
        ontext: function (text) {
            text = text.trim();
            if (!text) return;
            current = parseContentNode({
                type: HTMLASTNodeType.TEXT,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                parentNode: parent,
                content: text,
            });
            parent.childNodes.push(current);
        },
        oncomment: function (data) {
            // skip
        },
        oncdatastart: function () {
            let cdata = '';
            const startIndex = parser.startIndex + 9;
            const endIndex = parser.endIndex - 2;
            cdata = content.substring(startIndex, endIndex).trim();
            if (!cdata) return;
            current = parseContentNode({
                type: HTMLASTNodeType.TEXT,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                parentNode: parent,
                content: cdata,
            });
            parent.childNodes.push(current);
        },
        onerror: function (error) {
            throw error;
        },
    }, {
        decodeEntities: true,
        recognizeCDATA: true,
        recognizeSelfClosing: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
    });
    parser.write(content);
    parser.end();
    return result;
}
// -------------------------------------------------------
// regexps
// =======================================================
const inputRegExp = /^\[(.+?)\]$/;
const outputRegExp = /^\((.+?)\)$/;
const contentExpresionRegexp = /\{\{(.+?)\}\}/;
// -------------------------------------------------------
// parser functions
// =======================================================
function isClassInput(key: string): boolean {
    return key === 'class' || key.indexOf('class.') !== -1;
}
function isStyleInput(key: string): boolean {
    return key === 'style' || key.indexOf('style.') !== -1;
}
// 处理模板绑定中JSON的解析函数
function calcPlainValue(statement: string) {
    return new Function('', `return ${statement}`)();
}
// 
const plainValues = {
    'undefined': undefined,
    'null': null,
    'true': true,
    'false': false,
}
const jsonPropRegExp = new RegExp(`[\\{|\\,]\\s*[\\[|\\'|\\"]\\s*(.+?)\\s*[\\]|\\'|\\"]\\s*:`, 'g');
function splitKeyValue(str: string, previousIndex, previousLength, index) {
    let key = str.substr(previousIndex, previousLength).trim();
    key = key.substring(1, key.length - 1).trim();
    let value = str.substring(previousIndex + previousLength, index).trim();
    while (value.charAt(value.length - 1) === ',') {
        value = value.substr(0, value.length - 1).trim();
    }
    return [key, value];
}
function splitDynamicJSON(jsonStr: string): [string, string][] {
    jsonStr = (jsonStr || '').trim();
    const result = [];
    const props = jsonStr.match(jsonPropRegExp);
    if (props && props.length) {
        let key, value, previousIndex, previousMatch;
        jsonStr.replace(jsonPropRegExp, (match, text, matchIndex) => {
            if (previousIndex !== undefined) {
                result.push(splitKeyValue(jsonStr, previousIndex, previousMatch.length, matchIndex));
            }
            previousMatch = match;
            previousIndex = matchIndex;
            return '';
        });
        if (previousIndex !== undefined) {
            result.push(splitKeyValue(jsonStr, previousIndex, previousMatch.length, jsonStr.length - 1));
        }
    }
    return result;
}
// attributes
export function parseNode(node: IHTMLASTNode, extraAttrs?: any): IHTMLASTNode {
    // TODO escape | pipe | logic | custom attribute
    const attrs = {}, inputs = {}, outputs = {}, twoWays = {}, logics = {}, varibles = {},
        classes = {}, styles = {}, classInputs = {}, styleInputs = {};
    const rawAttrs = {
        ...(node.attrs || {}),
        ...(extraAttrs || {})
    }
    extraAttrs && Object.assign(node)
    Object.keys(rawAttrs).forEach(key => {
        const value = isDefined(rawAttrs[key]) ? (rawAttrs[key] as string).trim() : '';
        key = key.trim();
        if (!key) return;
        const sign = key.charAt(0);
        if (sign === '#') {
            // 处理id
            key = key.substr(1).trim();
            key && (node.id = key);
        } else if (sign === '*') {
            // 处理逻辑绑定
            logics[key] = parseStatement(value);
        } else if (key.indexOf('let-') === 0) {
            // 处理变量声明
            key = key.substr(4).trim();
            key && (varibles[key] = parseStatement(value));
        } else {
            // 处理输入输出绑定
            let isInput = false, isOutput = false, inputMatch, outputMatch;
            inputMatch = key.match(inputRegExp);
            isInput = !!inputMatch && !!inputMatch[1];
            if (isInput) {
                key = inputMatch[1].trim();
                if (key) {
                    outputMatch = key.match(outputRegExp);
                    isOutput = !!outputMatch && !!outputMatch[1];
                    isOutput && (key = outputMatch[1].trim());
                }
            } else {
                outputMatch = key.match(outputRegExp);
                isOutput = !!outputMatch && !!outputMatch[1];
                if (isOutput) {
                    key = outputMatch[1].trim();
                    if (key) {
                        inputMatch = key.match(inputRegExp);
                        isInput = !!inputMatch && !!inputMatch[1];
                        isInput && (key = inputMatch[1].trim());
                    }
                }
            }
            if (key) {
                if (isInput && isOutput) {
                    // 双向绑定
                    parseTwoWayAttrs(key, value, twoWays);
                } else if (!isInput && !isOutput) {
                    // 普通属性
                    parsePlainAttrs(key, value, attrs, classes, styles);
                } else if (isInput) {
                    // 绑定输入
                    parseInputAttrs(key, value, attrs, inputs, classes, styles, classInputs, styleInputs);
                } else if (isOutput) {
                    // 绑定输出
                    parseOuputAttrs(key, value, outputs);
                }
            }
        }
    });
    node.attrs = attrs;
    node.inputs = inputs;
    node.outputs = outputs;
    node.twoWays = twoWays;
    node.logics = logics;
    node.classes = classes;
    node.styles = styles;
    node.classInputs = classInputs;
    node.styleInputs = styleInputs;
    node.varibles = varibles;
    return node;
}
function parseContentNode(node: IHTMLASTNode): IHTMLASTNode {
    // content
    node.contents = parseContent(node.content);
    return node;
}
// input
function parseInputAttrs(key, value, attrs, inputs, classes, styles, classInputs, styleInputs) {
    if (isClassInput(key)) {
        parseClassInput(key, value, inputs, classes, classInputs);
    } else if (isStyleInput(key)) {
        parseStyleInput(key, value, inputs, styles, styleInputs);
    } else {
        const info = parseStatement(value);
        if (info.isPlainValue) {
            attrs[key] = calcPlainValue(value);
            // attrs[key] = normalizePlainValue(value);
        } else {
            inputs[key] = parseStatement(value);
        }
    }
}
// output
function parseOuputAttrs(key, value, outputs) {
    outputs[key] = parseStatement(value);
}
// plain attrs
function parsePlainAttrs(key, value, attrs, classes, styles) {
    if (key === 'class') {
        const classMap = parseToClassMap(value);
        Object.assign(classes, classMap);
    } else if (key === 'style') {
        const styleSheet = parseToStyleObject(value);
        Object.assign(styles, styleSheet);
    } else {
        attrs[key] = value;
    }
}
// class binding
function parseClassInput(key, value, inputs, classes, classInputs) {
    if (!value) return;
    const isJSON = value.charAt(0) === '{' && value.charAt(value.length - 1) === '}';
    let kvs = [], info: IStatementInfo;
    if (key === 'class') {
        if (isJSON) {
            // [class]="{'xxx': true, 'xxx': statement, [class]: true, [class]: statement}"
            // 处理JSON变量属性
            try { kvs = splitDynamicJSON(value); }
            catch (error) { throw wrapStatementParserErrorMessage(error, null, `[class]=${value}`); }
        } else {
            // [class]="statement"
            info = parseStatement(value);
            if (info.isPlainValue) {
                value = calcPlainValue(value);
                let classMap = {};
                if (typeof value === 'string') {
                    value = value.trim();
                    classMap = parseToClassMap(value);
                } else if (typeof value === 'object') {
                    classMap = value;
                }
                Object.keys(classMap).forEach(className => {
                    classes[className] = string2Boolean(classMap[className] + '');
                });
            } else {
                inputs.class = info;
            }
            return;
        }
    } else if (key.indexOf('class.') !== -1) {
        key = key.substr(6);
        if (isJSON) {
            throw wrapStatementParserErrorMessage('Unsupported expression statement', null, `[class.${key}]=${value}`);
        } else {
            info = parseStatement(value);
            if (info.isPlainValue) {
                // [class.className]="true"
                classes[key] = calcPlainValue(value);
            } else {
                // [class.className]="statement"
                classInputs[key] = info;
            }
            return;
        }
    }
    // 处理JSON风格的绑定
    kvs.forEach(kv => {
        if (!kv || kv.length !== 2) return;
        let key = kv[0];
        let v = kv[1];
        const valueInfo = parseStatement(v);
        if (key.charAt(0) === '[') {
            key = key.substr(1, key.length - 2).trim();
            if (!key) return;
            const keyInfo = parseStatement(key);
            if (keyInfo.isPlainValue) {
                key = calcPlainValue(key).trim();
                if (valueInfo.isPlainValue) {
                    // ['class']: true
                    classes[key] = string2Boolean(calcPlainValue(v) + '');
                } else {
                    // ['class']: statement
                    classInputs[key] = valueInfo;
                }
            } else {
                // [xxx]: true
                // [xxx]: statement
                classInputs[key] = [keyInfo, valueInfo.isPlainValue ? string2Boolean(calcPlainValue(v) + '') : valueInfo];
            }
        } else {
            key = calcPlainValue(key).trim();
            if (valueInfo.isPlainValue) {
                // 'class': true
                classes[key] = string2Boolean(calcPlainValue(v) + '');
            } else {
                // 'class': statement
                classInputs[key] = valueInfo;
            }
        }
    });
}
// style binding
function parseStyleInput(key, value, inputs, styles, styleInputs) {
    if (!value) return;
    const isJSON = value.charAt(0) === '{' && value.charAt(value.length - 1) === '}';
    let kvs = [], info: IStatementInfo;
    if (key === 'style') {
        if (isJSON) {
            // [style]="{'xxx': 'vvv', 'xxx': statement, [style]: true, [style]: statement}"
            try { kvs = splitDynamicJSON(value); }
            catch (error) { throw wrapStatementParserErrorMessage(error, null, `[style]=${value}`); }
        } else {
            // [style]="statement"
            info = parseStatement(value);
            if (info.isPlainValue) {
                value = calcPlainValue(value);
                let styleSheet;
                if (typeof value === 'string') {
                    value = value.trim();
                    styleSheet = parseToStyleObject(value);
                } else if (typeof value === 'object') {
                    styleSheet = value;
                }
                Object.keys(styleSheet).forEach(key => {
                    styles[key] = styleSheet[key];
                });
            } else {
                inputs.style = info;
            }
            return;
        }
    } else if (key.indexOf('style.') !== -1) {
        key = key.substr(6);
        if (isJSON) {
            throw wrapStatementParserErrorMessage('Unsupported expression statement', null, `[style.${key}]=${value}`);
        } else {
            info = parseStatement(value);
            key = cssProp2Prop(key);
            if (info.isPlainValue) {
                // [style.styleName]="value"
                styles[key] = calcPlainValue(value);
            } else {
                // [style.styleName]="statement"
                styleInputs[key] = info;
            }
        }
        return;
    }
    // 处理JSON风格的绑定
    kvs.forEach(kv => {
        if (!kv || kv.length !== 2) return;
        let key = kv[0];
        let v = kv[1];
        const valueInfo = parseStatement(v);
        if (key.charAt(0) === '[') {
            key = key.substr(1, key.length - 2).trim();
            if (!key) return;
            const keyInfo = parseStatement(key);
            if (keyInfo.isPlainValue) {
                key = calcPlainValue(key).trim();
                key = cssProp2Prop(key);
                if (valueInfo.isPlainValue) {
                    // ['style']: 'xxx'
                    styles[key] = calcPlainValue(v);
                } else {
                    // ['style']: statement
                    styleInputs[key] = valueInfo;
                }
            } else {
                // [xxx]: xxx
                // [xxx]: statement
                styleInputs[key] = [keyInfo, valueInfo.isPlainValue ? calcPlainValue(v) : valueInfo];
            }
        } else {
            key = calcPlainValue(key).trim();
            key = cssProp2Prop(key);
            if (valueInfo.isPlainValue) {
                // 'style': xxx
                styles[key] = calcPlainValue(v);
            } else {
                // 'style': statement
                styleInputs[key] = valueInfo;
            }
        }
    });
}
// content
function parseContent(content: string) {
    content = content || '';
    const contents = [];
    while (content) {
        const match = content.match(contentExpresionRegexp);
        if (match) {
            const index = match.index;
            let preText = content.substring(0, index);
            content = content.substr(index + match[0].length);
            const info = parseStatement(match[1] || '');
            if (info.isPlainValue) {
                preText += match[1] || '';
                preText && contents.push(preText);
            } else {
                preText && contents.push(preText);
                contents.push(info);
            }
        } else {
            break;
        }
    }
    content && contents.push(content);
    if (contents.length && contents.some(content => typeof content === 'object')) {
        return contents;
    } else {
        return content;
    }
}
// two ways binding
function parseTwoWayAttrs(key, value, twoWays) {
    twoWays[key] = parseStatement(value);
}