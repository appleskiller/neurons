import { Parser } from 'acorn';
import { isDefined, isEmpty } from 'neurons-utils';
import { globalLimitedDictionary } from 'neurons-utils';
import { wrapStatementParserErrorMessage } from './error';

function collectMemberParentStack(node, result?) {
    result = result || [];
    result.push(node);
    if (node.object) {
        collectMemberParentStack(node.object, result);
    }
    return result;
}

function collectNode(node, computed, token, result) {
    if (node.type === 'Literal') {
        // 如果未中断
        if (!token.suspend) {
            token.chain = token.chain === null ? node.value : token.chain + '.' + node.value;
        }
    } else if (node.type === 'Identifier') {
        // 如果不是计算属性，例如a['p'] 与 a[p](计算属性)
        if (!computed) {
            if (!token.suspend) {
                token.chain = token.chain === null ? node.name : token.chain + '.' + node.name;
            }
        } else {
            // 若为计算属性，将property采集为新属性
            result.chains[node.name] = true;
            // 同时结束当前采集
            token.chain !== null && (result.chains[token.chain] = true)
            token.chain = null;
            // 中断后续的node的非计算属性的处理
            token.suspend = true;
        }
    } else {
        token.chain !== null && (result.chains[token.chain] = true)
        token.chain = null;
        // 中断后续的node的非计算属性的处理
        token.suspend = true;
        collect(node, result);
    }
}
// TODO 暂时不能支持如[(item)]="arr[index]"所示的双向绑定的回调赋值的部分，因其属于动态属性范畴，目前系统对此类属性的表达和处理尚未支持完全
function collectMember(n, result) {
    // 倒序的链
    const nodeChains = collectMemberParentStack(n, []);
    const token = {chain: null, suspend: false};
    const len = nodeChains.length;
    for (let i = 0; i < len; i++) {
        const node = nodeChains.pop();
        if (node.type === 'MemberExpression') {
            collectNode(node.property, node.computed, token, result);
        } else {
            collectNode(node, node.computed, token, result);
        }
    }
    if (token.chain) {
        result.chains[token.chain] = true;
    }
}

// BUG this!!!!!!!!!!!
// 对于a.b.c.d的解析存在提前结束的问题，chains会是a.b!!!!
// BUG this!!!!!!!!!!!
// function collectMember(node, result) {
//     // 处理object
//     if (node.object) {
//         if (node.object.type === 'Literal') {
//             result.chain !== null && (result.chain = (result.chain ? result.chain + '.' + node.object.value : node.object.value));
//         } else if (node.object.type === 'Identifier') {
//             // 如果不是计算属性，例如a['p'] 与 a[p](计算属性)
//             if (!node.computed) {
//                 result.chain !== null && (result.chain = (result.chain ? result.chain + '.' + node.object.name : node.object.name));
//             } else {
//                 // 采集为新属性
//                 result.chain && (result.chains[result.chain] = true);
//                 result.chains[node.object.name] = true;
//                 result.chain = null;
//             }
//         } else {
//             collectMember(node.object, result);
//         }
//     }
//     // 处理property
//     if (node.property) {
//         // 如果未切断result.chain则继续采集
//         if (node.property.type === 'Literal') {
//             if (result.chain !== null) {
//                 result.chain = result.chain ? result.chain + '.' + node.property.value : node.property.value;
//                 result.chains[result.chain] = true;
//                 result.chain = null;
//             }
//         } else if (node.property.type === 'Identifier') {
//             // 如果不是计算属性，例如a['p'] 与 a[p](计算属性)
//             if (!node.computed) {
//                 if (result.chain !== null) {
//                     result.chain = result.chain ? result.chain + '.' + node.property.name : node.property.name;
//                     result.chains[result.chain] = true;
//                     result.chain = null;
//                 }
//             } else {
//                 // 采集为新属性
//                 result.chain && (result.chains[result.chain] = true);
//                 result.chains[node.property.name] = true;
//                 result.chain = null;
//             }
//         } else {
//             // 采集新属性
//             collect(node.property, result);
//         }
//     }
// }
// TODO 不支持从 变量及函数声明\控制语句\条件（三元表达式除外）\作用域 中提取绑定属性
const typeCollector = {
    Program: function (node, result) {
        node.body && node.body.length && node.body.forEach(n => {
            collect(n, result);
        })
    },
    ExpressionStatement: function (node, result) {
        node.expression && collect(node.expression, result);
    },
    BlockStatement: function (node, result) {
        node.body && node.body.length && node.body.forEach(n => {
            collect(n, result);
        })
    },
    LabeledStatement: function (node, result) {
        node.body && collect(node.body, result);
        node.label && collect(node.label, result);
    },
    LogicalExpression: function (node, result) {
        node.left && collect(node.left, result);
        node.right && collect(node.right, result);
    },
    AssignmentExpression: function (node, result) {
        node.left && collect(node.left, result);
        node.right && collect(node.right, result);
    },
    MemberExpression: function (node, result) {
        result.chain = '';
        collectMember(node, result);
        result.chain = null;
    },
    CallExpression: function (node, result) {
        if (node.callee) {
            if (node.callee.type === 'Identifier') {
                // 独立的函数标识符
                node.callee.name && (result.functions[node.callee.name] = true);
            } else {
                collect(node.callee, result)
            }
        }
        node.arguments && node.arguments.forEach(arg => {
            arg && collect(arg, result);
        });
    },
    Identifier: function (node, result) {
        // 独立的标识符
        node.name && (result.chains[node.name] = true);
    },
    BinaryExpression: function (node, result) {
        node.left && collect(node.left, result);
        node.right && collect(node.right, result);
    },
    ConditionalExpression: function (node, result) {
        node.test && collect(node.test, result);
        node.consequent && collect(node.consequent, result);
        node.alternate && collect(node.alternate, result);
    },
    UnaryExpression: function (node, result) {
        node.argument && collect(node.argument, result);
    },
    ArrayExpression: function (node, result) {
        node.elements && node.elements.forEach(element => {
            element && collect(element, result);
        });
    },
    ObjectExpression: function (node, result) {
        node.properties && node.properties.length && node.properties.forEach(n => {
            // 处理属性
            if (n.computed && n.key.type !== 'Literal') {
                collect(n.key, result);
            }
            collect(n.value, result);
        })
    },
    VariableDeclaration: function (node, result) {
        node.declarations && node.declarations.length && node.declarations.forEach(n => {
            collect(n, result);
        })
    },
    VariableDeclarator: function (node, result) {
        node.init && collect(node.init, result);
    }
}

function collect(node, result) {
    if (!node) return;
    const collector = typeCollector[node.type];
    if (!collector) return;
    collector(node, result);
}

export interface IStatementInfo {
    isPlainValue: boolean;
    isJSON: boolean;
    functions: { [name: string]: boolean };
    varibles: { [name: string]: boolean };
    chainProps: { [name: string]: boolean };
    statement: string;
}

const statementCache = globalLimitedDictionary<IStatementInfo>('neurons.expression_statement_cache');

export function parseStatement(value): IStatementInfo {
    const rawValue = value;
    value = isDefined(value) ? value + '' : '';
    value = value.trim();
    if (!value) {
        return {
            isPlainValue: true,
            isJSON: false,
            functions: {},
            varibles: {},
            chainProps: {},
            statement: value,
        }
    }
    if (statementCache.has(value)) {
        return { ...statementCache.get(value) };
    }
    const isJSON = (value.charAt(0) === '{' && value.charAt(value.length - 1) === '}'
        || value.charAt(0) === '[' && value.charAt(value.length - 1) === ']');
    if (isJSON) {
        value = `var __VALUE_IDENTIFIERS__ = ${value}`;
    }
    let jsAST;
    try {
        jsAST = Parser.parse(value);
    } catch (error) {
        throw wrapStatementParserErrorMessage(error, error.pos, rawValue);
    }
    const token = {
        chain: null,
        chains: {},
        functions: {},
    }
    collect(jsAST, token);
    const chainProps = Object.keys(token.chains);
    const chains = {};
    const identifiers = {};
    chainProps.forEach(chain => {
        if (chain.indexOf('this') === 0) {
            chain = chain.substr(4);
            if (chain.charAt(0) === '.') {
                chain = chain.substr(1);
            }
        }
        if (chain) {
            chains[chain] = true;
            let p = chain;
            let i = chain.indexOf('.');
            if (i !== -1) {
                p = p.substring(0, i);
            }
            if (!token.functions[p]) {
                identifiers[p] = true;
            }
        }
    });
    Object.assign(chains, token.functions);
    const result = {
        isPlainValue: isEmpty(chains),
        isJSON: false,
        functions: token.functions,
        varibles: identifiers,
        chainProps: chains,
        statement: rawValue,
    }
    if (isJSON) {
        delete result.varibles['__VALUE_IDENTIFIERS__'];
        delete result.chainProps['__VALUE_IDENTIFIERS__'];
    }
    statementCache.set(value, result);
    return { ...result };
}