import { wrapBindingErrorMessage } from '../compiler/parser/error';
import { IStatementInfo } from '../compiler/parser/statement';
import { INeBindingScope, INeBindingFunction } from './interfaces';
import { createElement, addEventListener } from 'neurons-dom';
import { domapi } from './domapi';
import { LoggerFactory } from '../../logger';

const logger = LoggerFactory.getLogger('neurons.binding');

export function invokeBindingFunction(func, context, implicits, targetKey: string, statement: string, skipError?: boolean) {
    let v;
    try {
        v = implicits ? func.call(context, implicits) : func.call(context);
    } catch (error) {
        if (skipError) {
            logger.error(error);
            return statement;
        } else {
            throw wrapBindingErrorMessage(error, targetKey || '', statement);
        }
    }
    return v;
}

export function composeVaribles(info: IStatementInfo) {
    const funcs = Object.keys(info.functions);
    const vars = Object.keys(info.varibles);
    if (!vars.length && !funcs.length) return '';
    let result = '';
    if (funcs.length) {
        const funcPre = 'var __THAT__ = this;';
        const functions = funcs.map(name => {
            return `var ${name} = function () {
    return __THAT__.${name}.apply(__THAT__, arguments);
};`
        }).join('\n');
        result = `${result}\n${funcPre}\n${functions}`;
    }
    if (vars.length) {
        const varibles = vars.map(v => {
            return `var ${v} = (arguments[0] && '${v}' in arguments[0]) ? arguments[0]['${v}'] : this.${v};`
        }).join(';');
        result = `${result}\n${varibles}`;
    }
    return result;
}

export function composeGetter(key: string, info: IStatementInfo, skipError?: boolean): INeBindingFunction {
    // this -> context, arguments[0] -> extraVaribles
    const getter = new Function('', `${composeVaribles(info)}\nreturn (${info.statement})`);
    const statement = info.statement;
    return function (scope: INeBindingScope) {
        return invokeBindingFunction(getter, scope.context, scope.implicits, key, statement, skipError);
    }
}
export function composeCallback(key: string, info: IStatementInfo, skipError?: boolean): INeBindingFunction {
    // this -> context, arguments[0] -> extraVaribles
    let trigger = '', assignment = '', body = '';
    let statement = info.statement.trim();
    if (info.varibles[statement]) {
        // (out)="value" -> value = $event; valueChange.emit($event);
        // 单向的事件输出流
        statement = `
if (this.${statement} !== $event) {
    this.${statement} = $event;
    if (this.${statement}Change && typeof this.${statement}Change.emit === 'function') {
        this.${statement}Change.emit(this.${statement});
    }
}`;
    } else if (info.chainProps[statement]) {
        // (out)="object.value" -> object.value = $event;
        statement = `
if (${statement} !== $event) {
    ${statement} = $event;
}`;
    }
    const fakeInfo = {
        ...info,
        varibles: {
            ...(info.varibles || {}),
            '$event': true,
        }
    };
    const callback = new Function('', `${composeVaribles(fakeInfo)}\n${statement};`);
    return function (scope: INeBindingScope) {
        return invokeBindingFunction(callback, scope.context, scope.implicits, key, statement, skipError);
    }
}


const plainAttrsProcessor = {
    'innerHTML': {
        filter: element => true,
        set: (element, value) => {
            if (typeof value === 'string') {
                const div = createElement('div');
                div.innerHTML = value;
                for (var i: number = 0; i < div.childNodes.length; i++) {
                    element.appendChild(div.childNodes.item(i));
                }
            } else {
                value && element.appendChild(value);
            }
        }
    },
    'value': {
        filter: element => (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement),
        set: (element, value) => {
            element.value = value;
        }
    },
    'checked': {
        filter: element => (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement),
        set: (element, value) => {
            element.checked = value;
        }
    },
}

export function processPlainElementAttrs(element, key, value) {
    if (plainAttrsProcessor[key] && plainAttrsProcessor[key].filter(element)) {
        plainAttrsProcessor[key].set(element, value);
    } else if (value === undefined || value === null) {
        element.removeAttribute(key);
    } else {
        element.setAttribute(key, value);
    }
}

function addInputValueChange(element, handle) {
    const offPropChange = addEventListener(element, 'propertychange', handle);
    const offInputChange = addEventListener(element, 'input', handle);
    return function () {
        offPropChange();
        offInputChange();
    }
}

const plainEventProcessor = {
    'value': {
        filter: element => (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement),
        listen: (element, handler) => {
            const onValueChange = function (event) {
                handler(element.value);
            }
            return addInputValueChange(element, onValueChange);
        }
    },
    'valueChange': {
        filter: element => (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement),
        listen: (element, handler) => {
            const onValueChange = function (event) {
                handler(element.value);
            }
            return addInputValueChange(element, onValueChange);
        }
    },
    'checked': {
        filter: element => (element instanceof HTMLInputElement),
        listen: (element, handler) => {
            return addEventListener(element, 'input', event => handler(element.checked));
        }
    },
    'checkedChange': {
        filter: element => (element instanceof HTMLInputElement),
        listen: (element, handler) => {
            return addEventListener(element, 'input', event => handler(element.checked));
        }
    },
}

export function processPlainElementEvent(element, targetKey, handler) {
    if (plainEventProcessor[targetKey] && plainEventProcessor[targetKey].filter(element)) {
        return plainEventProcessor[targetKey].listen(element, handler);
    } else {
        return domapi.addEventListener(element, targetKey, handler);
    }
}