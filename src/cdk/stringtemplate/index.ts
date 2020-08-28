
import { IBindingRef } from '../../binding/common/interfaces';
import { composeGetter } from '../../binding/common/util';
import { parseContent } from '../../binding/compiler/parser/template';
import { parseStatement } from '../../binding/compiler/parser/statement';
import { createElement, removeMe } from 'neurons-dom';
import { globalLimitedDictionary, merge } from 'neurons-utils';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';

export type StringBindingFunction = (data: any) => string;

const compiledStringCache = globalLimitedDictionary<StringBindingFunction>('neurons.compiled_string_cache');

export interface IStringBindingRef {
    bind(data: any): void;
    setState(state: any): void;
    detectChanges(): void;
    destroy(): void;
}

export class StringBindingRef implements IStringBindingRef {
    constructor(public bindingFunction: StringBindingFunction) {}
    private _nativeEmitter = new EventEmitter();
    private _binded = false;
    private _destroyed = false;
    private _data;
    private _initState;
    
    text: string = '';
    textChange: IEmitter<string> = emitter('textChange', this._nativeEmitter);

    bind(data: any): void {
        if (this._destroyed) return;
        this._data = data || {};
        this._initState && merge(true, this._data, this._initState);
        this._initState = null;
        this._binded = true;
        this._render();
    }
    setState(state: any): void {
        if (this._binded) {
            merge(true, this._data, state || {});
            this._render();
        } else {
            this._initState = this._initState || {};
            merge(true, this._initState, state || {});
        }
    }
    detectChanges(): void {
        if (this._destroyed || !this._binded) return;
        this._render();
    }
    destroy(): void {
        this._destroyed = true;
        this._nativeEmitter.off();
    }
    private _render() {
        if (this._destroyed) return;
        const text = this.bindingFunction(this._data);
        if (this.text !== text) {
            this.text = text;
            this.textChange.emit(this.text);
        }
    }
}

export function compileStringTemplate(stringTemplate: string): StringBindingFunction {
    if (!stringTemplate) return () => stringTemplate;
    let bindingFunction = compiledStringCache.get(stringTemplate);
    if (bindingFunction) return bindingFunction;
    const parsed = parseContent(stringTemplate);
    let contents: any[];
    if (typeof parsed === 'string') {
        contents = [parsed];
    } else {
        contents = parsed.map(item => {
            if (typeof item === 'string') {
                return item;
            } else {
                const getter = composeGetter('StringBinding', item, true);
                return data => getter({context: data})
            }
        }).reduce((ret, current) => {
            if (!ret.length) {
                ret.push(current);
            } else {
                if (typeof current === 'string' && typeof ret[ret.length - 1] === 'string') {
                    ret[ret.length - 1] = ret[ret.length - 1] + current;
                } else {
                    ret.push(current);
                }
            }
            return ret;
        }, []);
    }
    if (contents.every(content => typeof content === 'string')) {
        bindingFunction = () => stringTemplate;
    } else {
        bindingFunction = data => {
            data = data || {};
            return contents.map(content => {
                if (typeof content === 'string') return content;
                return content(data);
            }).join('');
        }
    }
    compiledStringCache.set(stringTemplate, bindingFunction);
    return bindingFunction;
}

export function renderStringTemplate(stringTemplate: string, data: any): string {
    const bindingFunction = compileStringTemplate(stringTemplate);
    return bindingFunction(data);
}

export function bindStringTemplate(stringTemplate: string): IStringBindingRef {
    return new StringBindingRef(compileStringTemplate(stringTemplate));
}