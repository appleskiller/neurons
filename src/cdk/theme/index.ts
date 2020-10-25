import { IBindingRef } from '../../binding/common/interfaces';
import { composeGetter } from '../../binding/common/util';
import { parseContent } from '../../binding/compiler/parser/template';
import { parseStatement } from '../../binding/compiler/parser/statement';
import { createElement, removeMe } from 'neurons-dom';
import { globalLimitedDictionary } from 'neurons-utils';

type CompiledCSSBlock = string | (string | ((theme) => string))[];

const compiledCSSCache = globalLimitedDictionary<CompiledCSSBlock[]>('neurons.compiled_css_cache');

export class ThemeBindingRef {
    constructor(private container: HTMLElement, private compiledCSS: (string | ((theme) => string))[], private theme: any) {
        this.isPlain = !this.compiledCSS || !this.compiledCSS.length || this.compiledCSS.every(item => typeof item === 'string');
        this.styleDom = createElement('style') as HTMLStyleElement;
        this.styleDom.type = 'text/css';
        if (this.compiledCSS && this.compiledCSS.length) {
            const cssString = this.bind(theme);
            this.styleDom.innerHTML = cssString;
            this.container.appendChild(this.styleDom);
            this.previous = cssString;
        }
    }
    private isPlain;
    private styleDom: HTMLStyleElement;
    private previous: string;
    detectChanges() {
        if (this.isPlain) return;
        const cssString = this.bind(this.theme);
        if (this.previous !== cssString) {
            this.previous = cssString;
            this.styleDom.innerHTML = cssString;
        }
    }
    destroy() {
        removeMe(this.styleDom);
    }
    private bind(theme): string {
        theme = theme || {};
        let result = '';
        if (this.isPlain) {
            result = this.compiledCSS.join('');
        } else {
            result = this.compiledCSS.map(item => {
                if (typeof item === 'string') {
                    return item;
                } else {
                    return item(theme);
                }
            }).join('');
        }
        result = result.trim();
        result && (result = `\n${result}\n`)
        return result;
    }
}

function compileCSS(css: string): (string | ((theme) => string))[] {
    css = css || '';
    css = css.trim();
    if (!css) return [];
    const parsed = parseContent(css, '$');
    if (typeof parsed === 'string') {
        return [parsed];
    } else {
        return parsed.map(item => {
            if (typeof item === 'string') {
                return item;
            } else {
                const getter = composeGetter('ThemeBinding', item);
                return theme => {
                    let value;
                    try {
                        value = getter({context: theme})
                    } catch (error) {
                        value = '';
                    }
                    return value;
                }
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
}

const openRegExp = /\{/;
const closeRegExp = /\}/;

function firstChar(str: string): string {
    const openIndex = str.search(openRegExp);
    const closeIndex = str.search(closeRegExp);
    const index = str.indexOf(';');
    let min = openIndex;
    min = min === -1 ? closeIndex : (closeIndex == -1 ? min : Math.min(min, closeIndex));
    min = min === -1 ? index : (index == -1 ? min : Math.min(min, index));
    if (min === -1) return '';
    if (min === index) return ';';
    if (min === closeIndex) return '}';
    return '{';
}

function pickCSSBody(css: string, selector: string = '') {
    css = css || '';
    if (!css) return {rest: '', blocks: []};
    let rest = css, blocks = [], body;
    let closeIndex = rest.search(closeRegExp);
    while(closeIndex >= 0) {
        let openIndex = rest.search(openRegExp);
        if (openIndex === -1 || openIndex > closeIndex) {
            // 直接结束
            body = rest.substr(0, closeIndex);
            !!body.trim() && blocks.push(`${selector} {${body}\n}`);
            rest = rest.substr(closeIndex + 1);
            return {rest: rest, blocks: blocks};
        } else {
            let index = (rest.substr(0, openIndex)).lastIndexOf(';');
            if (index !== -1) {
                body = rest.substr(0, index + 1);
                !!body.trim() && blocks.push(`${selector} {${body}\n}`);
                rest = rest.substr(index + 1);
            }
            // 子节点
            const ret = pickCSSBlocks(rest, selector);
            // const ret = pickCSSBlocks(`${selector} { ${rest}`);
            rest = ret.rest;
            blocks = blocks.concat(ret.blocks);
            // 继续查找
            closeIndex = rest.search(closeRegExp);
        }
    }
    rest = rest.trim();
    if (rest) {
        blocks.push(`${selector} {${rest}\n}`);
    }
    return {rest: rest, blocks: blocks};
}

const pairRegExp = /[\{\}]/;
function subStringByPaired(str: string) {
    let match = str.match(pairRegExp);
    if (!match || match[0] !== '{') return '';
    let level = 1;
    let index = match.index;
    let rest = str.substr(match.index + 1);
    while(level && rest) {
        match = rest.match(pairRegExp);
        if (!match) break;
        index = index + match.index + 1;
        rest = rest.substr(match.index + 1);
        if (match[0] === '}') {
            level -= 1;
        } else {
            level += 1;
        }
    }
    // 不是完整闭合的结构
    if (level) return '';
    return str.substr(0, index + 1);
}
const keyframesRegExp = /\@[a-zA-Z\-]{0,}keyframes/;
function pickAtCSSBlocks(css: string, selector = '', prefix: string = '') {
    let ret, rest;
    if (selector.search(keyframesRegExp) === 0) {
        const tmp = `${selector} { ${css}`;
        const str = subStringByPaired(tmp);
        if (str) {
            // 直接返回
            return {
                rest: tmp.substr(str.length),
                blocks: [str]
            }
        }
    }
    ret = pickCSSBlocks(css, prefix);
    rest = ret.rest.trim();
    if (rest.indexOf('}') === 0) {
        rest = rest.substr(1);
    }
    return {
        rest: rest,
        blocks: (ret.blocks || []).map(block => {
            return `${selector} {\n${block}\n}`;
        })
    }
}

function pickCSSBlocks(css: string, prefix: string = '') {
    css = css || '';
    if (!css) return {rest: '', blocks: []};
    let rest = css, blocks = [], openIndex, closeIndex, index;
    while (rest) {
        openIndex = rest.search(openRegExp);
        if (openIndex >= 0) {
            let selector = rest.substring(0, openIndex).trim();
            if (selector) {
                let ret;
                if (selector.charAt(0) === '@') {
                    ret = pickAtCSSBlocks(rest.substr(openIndex + 1), selector, prefix);
                } else {
                    // &作为连接符
                    if (selector.charAt(0) === '&') {
                        selector = prefix + selector.substr(1);
                    } else {
                        selector = prefix ? prefix + ' ' + selector : selector;
                    }
                    ret = pickCSSBody(rest.substr(openIndex + 1), selector);
                }
                rest = ret.rest;
                blocks = blocks.concat(ret.blocks);
                // 检查平级节点
                const char = firstChar(rest);
                if (char === ';' || char === '}') {
                    return {rest: rest, blocks: blocks};
                }
            } else {
                rest = '';
            }
        } else {
            rest = '';
        }
    }
    return {rest: rest, blocks: blocks};
}

export interface IThemeBinding {
    setState(state: any): void;
    detectChanges(): void;
    destroy(): void;
}

export function bindTheme(css: string, theme: any, prefix: string = ''): IThemeBinding {
    let compiledCSS = compiledCSSCache.get(css);
    if (!compiledCSS) {
        const ret = pickCSSBlocks(css);
        const blocks = ret.blocks;
        compiledCSS = blocks.reduce((ret, current) => {
            const compiled = compileCSS(current);
            if (compiled.length) {
                const isPlain = compiled.every(item => typeof item === 'string');
                if (isPlain) {
                    ret.push(compiled.join(''));
                } else {
                    ret.push(compiled);
                }
            }
            return ret;
        }, []);
        compiledCSSCache.set(css, compiledCSS);
    }
    // 添加prefix
    prefix = (prefix || '').trim();
    if (compiledCSS.length) {
        compiledCSS = compiledCSS.reduce((ret, compiled) => {
            const isPlain = typeof compiled === 'string';
            if (prefix) {
                if (typeof compiled === 'string') {
                    compiled = `${prefix} ${compiled}`;
                } else {
                    compiled = compiled.concat();
                    compiled.unshift(`${prefix} `);
                }
            }
            if (!ret.length) {
                ret.push(compiled);
            } else {
                if (isPlain && typeof ret[ret.length - 1] === 'string') {
                    ret[ret.length - 1] = ret[ret.length - 1] + '\n' + compiled;
                } else if (!isPlain && typeof ret[ret.length - 1] !== 'string'){
                    ret[ret.length - 1] = (ret[ret.length - 1] as any[]).concat(['\n']).concat(compiled);
                } else {
                    ret.push(compiled);
                }
            }
            return ret;
        }, ([] as CompiledCSSBlock[]));
    }
    let internalTheme = {...(theme || {})};
    const refs = compiledCSS.map(compiled => {
        if (typeof compiled === 'string') {
            return new ThemeBindingRef(document.head, [compiled], internalTheme);
        } else {
            return new ThemeBindingRef(document.head, compiled, internalTheme);
        }
    });
    let _destroyed = false;
    const binding = {
        setState: (state) => {
            if (_destroyed || !state) return;
            Object.assign(internalTheme, state);
            refs.forEach(ref => ref.detectChanges());
        },
        detectChanges: () => {
            if (_destroyed) return;
            refs.forEach(ref => ref.detectChanges());
        },
        destroy: () => {
            refs.forEach(ref => ref.destroy());
            _destroyed = true;
        }
    };
    return binding;
}
