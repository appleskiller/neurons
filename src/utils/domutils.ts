import { isBrowser, isDomLevel2 } from './osutils';
import { isDefined, isEmpty, isArray } from './typeutils';
import { globalLimitedDictionary } from './cacheutils';

const textMeasureCache = globalLimitedDictionary<{width: number, height: number}>('text_measure_cache');

export function isInDocument(node: Element): boolean {
    if (!isBrowser || !document) return true;
    if (!node) return false;
    return (node === document.body || document.body.contains(node));
}

const escapeRegExp = /[\"\'\&\<\>]/;
const escapeChars = {
    '<': '&lt',
    '>': '&gt',
    "'": '&#39',
    '"': '&quot',
    '&': '&amp',
}
export function escape(v: string): string {
    if (typeof v !== 'string') return v;
    let str = '' + v;
    const match = escapeRegExp.exec(str)
    if (!match) {
        return str;
    }
    let escape, char, html = '', index = 0, lastIndex = 0;
    for (index = match.index; index < str.length; index++) {
        char = str.charAt(index);
        if (char in escapeChars) {
            escape = escapeChars[char]
            if (lastIndex !== index) {
                html += str.substring(lastIndex, index)
            }
            lastIndex = index + 1
            html += escape
        }
    }
    return lastIndex !== index ? html + str.substring(lastIndex, index) : html
}

const rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

export function trim(str: string): string {
    str = str || '';
    return (str + '').replace(rtrim, '');
}
export function parseToClassMap(className: string) {
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) return {};
    const result = {};
    classNames.forEach(className => {
        result[className] = true;
    })
    return result;
}
export function addClass(el: HTMLElement, className: string) {
    if (!el || el.nodeType !== 1 || !className) return;
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) return;
    if (!el.className) {
        el.setAttribute('class', className);
    } else {
        let elClass = ' ' + el.className + ' ';
        for (let i = 0; i < classNames.length; i++) {
            if (elClass.indexOf(' ' + classNames[i] + ' ') === -1) {
                elClass += classNames[i] + ' ';
            }
        }
        el.setAttribute('class', trim(elClass));
    }
}
export function removeClass(el: HTMLElement, className: string) {
    if (!el || el.nodeType !== 1) return;
    if (!el.className) return;
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) {
        el.setAttribute('class', '');
    } else {
        let elClass = ' ' + el.className + ' ';
        for (let i = 0; i < classNames.length; i++) {
            elClass = elClass.replace(' ' + classNames[i] + ' ', ' ');
        }
        el.setAttribute('class', trim(elClass));
    }
}

export function hasClass(el: HTMLElement, className: string): boolean {
    if (!el || el.nodeType !== 1) return false;
    if (!el.className) return false;
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) {
        return true;
    } else {
        let elClass = ' ' + el.className + ' ';
        return classNames.every(name => elClass.indexOf(' ' + name + ' ') !== -1);
    }
}

function fixEventType(el, name) {
    if (name === 'mousewheel') {
        if(el.onmousewheel === undefined) {
            // 兼容firefox滚轮事件，事件类型为DOMMouseScroll且只能使用DOM2级事件绑定
            name = "DOMMouseScroll";
        }
    }
    return name;
}
function wrapEvent(name, e) {
    e = e || window.event;
    if (!('stopPropagation' in e)) {
        e.stopPropagation = function () { e.cancelBubble = true; }
    }
    if (!('stopImmediatePropagation' in e)) {
        e.stopImmediatePropagation = function () { e.cancelBubble = true; }
    }
    if (!('preventDefault' in e)) {
        e.preventDefault = function () { e.returnValue = false; e.defaultPrevented = true; }
        e.defaultPrevented = false;
    }
    if (name === 'mousewheel') {
        // firefox滚轮事件滚动方向兼容
        if(!e.wheelDelta) {
            e.wheelDelta = e.detail/-3*120;
        }
    }
    return e;
}
function removeEventListener(el, name, handler) {
    if (!el) return;
    if (isDomLevel2) {
        el.removeEventListener(name, handler);
    } else {
        el.detachEvent('on' + name, handler);
    }
}
export function addEventListener(el, name, handler) {
    const type = fixEventType(el, name);
    const _handle = function (e) {
        e = wrapEvent(name, e);
        return handler.call(this, e);
    }
    if (isDomLevel2) {
        el.addEventListener(type, _handle);
    } else {
        el.attachEvent('on' + type, _handle);
    }
    return function () {
        removeEventListener(el, type, _handle);
    };
}

export type CSSStyleSheet = CSSStyleDeclaration | {[key: string]: any};

export function createElement(tagName: string, className?: string, style?: CSSStyleSheet, xmlns?: string) {
    const el = xmlns ? (document.createElementNS(xmlns, tagName) as HTMLElement) : document.createElement(tagName);
    className && (el.className = className);
    style && Object.assign(el.style, style);
    return el;
}

export function createDocumentFragment(): DocumentFragment {
    return document.createDocumentFragment();
}

export interface ISVGIcon {
    prefix: string;
    iconName: string;
    icon: [
        number, // width
        number, // height
        string[], // ligatures
        string, // unicode
        string // svgPathData
    ];
}
export interface ISVGIconDefinition {
    width: number;
    height: number;
    name: string;
    path: string;
    prefix: string;
}
let svgIconAppended = false;
function validateSvgIconCss() {
    if (!svgIconAppended) {
        const cssText = `
ne-svg-icon {
    display: inline-block;
    width: 100%;
    height: 100%;
    text-align: center;
}
svg:not(:root).ne-svg-icon {
    overflow: visible;
    display: inline-block;
    vertical-align: middle;
    font-size: inherit;
    width: 1em;
    height: 1em;
}
ne-svg-icon > i {
    display: inline-block;
    vertical-align: middle;
    height: 100%;
    width: 0;
}
`;
        appendCSSTag(cssText);
        svgIconAppended = true;
    }
}
export function createSvgIcon(className, input: ISVGIcon | ISVGIconDefinition) {
    validateSvgIconCss();
    const el = createElement('ne-svg-icon', `${className}`);
    // ISVGIconDefinition
    let icon: ISVGIcon = input as ISVGIcon;
    if ('width' in icon && 'height' in icon && 'path' in icon) {
        icon = {
            iconName: (input as ISVGIconDefinition).name,
            prefix: (input as ISVGIconDefinition).prefix,
            icon: [
                (input as ISVGIconDefinition).width,
                (input as ISVGIconDefinition).height,
                [],
                '',
                (input as ISVGIconDefinition).path
            ]
        }
    }
    el.innerHTML = `
<svg aria-hidden="true" class="ne-svg-icon" data-prefix="${icon.prefix || ''}" data-icon="${icon.iconName || ''}" role="img"
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.icon[0]} ${icon.icon[1]}">
    <path fill="currentColor" d="${icon.icon[4]}"></path>
</svg><i/>
`;
    return el;
}
export function getSvgIconTemplate() {
    validateSvgIconCss();
    return `
<ne-svg-icon>
    <svg aria-hidden="true" class="ne-svg-icon" [data-prefix]="icon.prefix || ''" [data-icon]="icon.iconName || ''" role="img"
        xmlns="http://www.w3.org/2000/svg" [viewBox]="'0 0 ' + (icon.icon[0] || 0) + ' ' + (icon.icon[1] || 0)">
        <path fill="currentColor" [d]="icon.icon[4] || ''"></path>
    </svg><i/>
</ne-svg-icon>
`;
}

let scrollbarWidth;

export function getScrollbarWidth() {
    if (isDefined(scrollbarWidth)) {
        return scrollbarWidth;
    }
    const oP = document.createElement('p'), styles = {
        width: '100px',
        height: '100px',
        overflowY: 'scroll',
    };
    Object.assign(oP.style, styles);
    document.body.appendChild(oP);
    scrollbarWidth = oP.offsetWidth - oP.clientWidth;
    oP.remove();
    return scrollbarWidth;
}

export function getSize(dom) {
    const stl = document.defaultView.getComputedStyle(dom);
    return {
        width: (dom['clientWidth'] || parseInt(stl['width'], 10) || parseInt(dom.style['width'], 10)) - (parseInt(stl['paddingLeft'], 10) || 0) - (parseInt(stl['paddingRight'], 10) || 0) | 0,
        height: (dom['clientHeight'] || parseInt(stl['height'], 10) || parseInt(dom.style['height'], 10)) - (parseInt(stl['paddingTop'], 10) || 0) - (parseInt(stl['paddingBottom'], 10) || 0) | 0
    }
}
export function getMaxHeight(dom: HTMLElement) {
    if (dom.style.height) return parseInt(dom.style.height);
    const stl = document.defaultView.getComputedStyle(dom);
    let maxHeight = stl['maxHeight'];
    if (maxHeight && maxHeight.indexOf('%') !== -1) {
        return parseInt(stl['height'], 10);
    } else {
        return parseInt(maxHeight, 10);
    }
}
export function getScrollSize(dom) {
    return {
        width: dom.scrollWidth,
        height: dom.scrollHeight
    }
}
export function getWidth(dom) {
    const stl = document.defaultView.getComputedStyle(dom);
    // tslint:disable-next-line:no-bitwise
    return (dom['clientWidth'] || parseInt(stl['width'], 10) || parseInt(dom.style['width'], 10)) - (parseInt(stl['paddingLeft'], 10) || 0) - (parseInt(stl['paddingRight'], 10) || 0) | 0;
}
export function getHeight(dom) {
    const stl = document.defaultView.getComputedStyle(dom);
    // tslint:disable-next-line:no-bitwise
    return (dom['clientHeight'] || parseInt(stl['height'], 10) || parseInt(dom.style['height'], 10)) - (parseInt(stl['paddingTop'], 10) || 0) - (parseInt(stl['paddingBottom'], 10) || 0) | 0;
}
const cssRegexp = /[A-Z]/g;
export function prop2CssProp(prop) {
    if (!prop) return prop;
    return prop.replace(cssRegexp, k => '-' + k.toLowerCase());
}
const cssPropRegexp = /-[a-z]/g;
export function cssProp2Prop(prop) {
    if (!prop) return prop;
    return prop.replace(cssPropRegexp, k => k.substr(1).toUpperCase());
}
const pixelFunc = (value) => ((typeof value === 'number') ? value + 'px' : value);
const value2css = {
    'width': pixelFunc,
    'height': pixelFunc,
    'minWidth': pixelFunc,
    'minHeight': pixelFunc,
    'maxWidth': pixelFunc,
    'maxHeight': pixelFunc,
    'fontSize': pixelFunc,
    'top': pixelFunc,
    'bottom': pixelFunc,
    'left': pixelFunc,
    'right': pixelFunc,
    'paddingLeft': pixelFunc,
    'paddingTop': pixelFunc,
    'paddingRight': pixelFunc,
    'paddingBottom': pixelFunc,
    'marginLeft': pixelFunc,
    'marginTop': pixelFunc,
    'marginRight': pixelFunc,
    'marginBottom': pixelFunc,
    'lineHeight': pixelFunc,
}
export function value2CssValue(prop, value) {
    return value2css[prop] ? value2css[prop](value) : value;
}
const resetCSS = function (dom, prop) {
    const old = {};
    for (const i in prop) {
        old[i] = dom.style[i];
        dom.style[i] = prop[i];
    }
    return old;
};
const restoreCSS = function (dom, prop) {
    for (const i in prop) {
        dom.style[i] = prop[i];
    }
};
function cssWidth(dom) {
    if (dom.style.width) { return dom.style.width; }
    if (dom.currentStyle) { return dom.currentStyle.width; }
    if (document.defaultView && document.defaultView.getComputedStyle) {
        return document.defaultView.getComputedStyle(dom, '').getPropertyValue('width');
    }
}
function cssHeight(dom) {
    if (dom.style.height) { return dom.style.height; }
    if (dom.currentStyle) { return dom.currentStyle.height; }
    if (document.defaultView && document.defaultView.getComputedStyle) {
        return document.defaultView.getComputedStyle(dom, '').getPropertyValue('height');
    }
}
function size(dom) {
    if (typeof window === 'undefined') {
        return { width: 0, height: 0 };
    }
    if (window.getComputedStyle && window.getComputedStyle(dom).display !== 'none') {
        return {
            width: dom.offsetWidth,
            height: dom.offsetHeight
        } || {
            width: cssWidth(dom),
            height: cssHeight(dom)
        };
    }
    const old = resetCSS(dom, {
        display: '',
        visibility: 'hidden',
        position: 'absolute'
    });
    const result = {
        width: dom.clientWidth,
        height: dom.clientHeight
    } || {
        width: cssWidth(dom),
        height: cssHeight(dom)
    };
    restoreCSS(dom, old);
    return result;
}

// 通过字号粗略计算字体高度的魔法数值
export const MAGIC_NUMBER = 0.24;

// export function 
/**
 * Measures text height。这是一个粗略的方法，但速度会比measureText快
 * @author AK
 * @param style 
 */
export function measureTextHeight(fontFamily: string, fontSize: number | string, fontWeight: string, fontStyle: string) {
    const size = measureText('国', {
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
    });
    return size.height;
}
/**
 * 指定文字的大小。
 **/
export function measureText(str, css, className?) {
    if (!str) {
        return { width: 0, height: 0 };
    }
    css = css || '';
    if (typeof css !== 'string') {
        let prop, cssStr = '';
        for (prop in css) {
            cssStr += parseToCss(prop, css[prop]);
        }
        css = cssStr;
    }
    const key = `${str}_${css}_${className || ''}`;
    let s = textMeasureCache.get(key);
    if (s) return s;
    const spanId = 'sjg-measure-string-size';
    let span = document.getElementById(spanId);
    if (!span) {
        span = document.createElement('span');
        span.setAttribute('id', spanId);
        document.body.appendChild(span);
    }
    setInnerText(span, str);
    span.setAttribute('style', css);
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'nowrap';
    if (className) {
        span.className = className;
    }
    s = size(span);
    span.style.display = 'none';
    span.className = '';
    textMeasureCache.set(key, s);
    return s;
}
export function getPixel(value: number | string, size: number, defaultValue?: number | string): number {
    if (!isDefined(value) && !isDefined(defaultValue)) return NaN;
    let valueType = typeof value;
    if (value === '' || (valueType === 'number' && isNaN(value as number))) {
        if (!isDefined(defaultValue)) return NaN;
        value = defaultValue;
        valueType = typeof value;
    }
    if (valueType === 'number') {
        return value as number;
    } else {
        if (value === '') return NaN;
        let sign = 1, str: string = value as string;
        if (str.charAt(0) === '-') {
            sign = -1;
            str = str.substr(1);
        }
        if (str.indexOf('%') !== -1) {
            return sign * size * parseFloat(str) / 100;
        } else {
            return sign * parseFloat(str);
        }
    }
}
export function parseToStylesheet(obj) {
    obj = obj || {};
    return Object.keys(obj).reduce((p, key) => {
        return `${p}\n${parseToCss(key, obj[key])}`;
    }, '');
}
export function parseToStyleObject(styleString: string) {
    styleString = (styleString || '').trim();
    if (!styleString) return {};
    const result = {};
    styleString.split(';').forEach(str => {
        const array = str.trim().split(':');
        array[0] = (array[0] || '').trim();
        array[1] = (array[1] || '').trim();
        if (array[0] && array[1]) {
            result[cssProp2Prop(array[0])] = array[1];
        }
    });
    return result;
}
export function parseToCss(key, value): string {
    return `${prop2CssProp(key)}: ${value2CssValue(key, value)};`;
}
export function appendCSSTag(cssText, params?) {
    if (document && document.head) {
        const dom = document.createElement('style');
        dom.type = 'text/css';
        dom.innerHTML = cssText;
        params = params || {};
        Object.keys(params).forEach(key => {
            key && dom.setAttribute(key, params[key]);
        })
        document.head.appendChild(dom);
    }
}
const appended = {};
export function appendCSSTagOnce(id, cssText, params?) {
    if (appended[id]) return;
    appended[id] = true;
    appendCSSTag(cssText, params);
}

export interface IHTMLWidgetStyleSheet {
    [className: string]: CSSStyleDeclaration | {[styleName: string]: any};
}

export function replaceCSSString(styleDom, sheets: IHTMLWidgetStyleSheet[], namespace) {
    if (!styleDom || !sheets || !sheets.length) return;
    const content = (sheets || []).map(sheet => {
        return Object.keys(sheet || {}).map(className => {
            const style = sheet[className];
            if (className.indexOf('&') === 0) {
                className = className.substr(1);
                return `${namespace}${className} {\n${parseToStylesheet(style)}\n}`
            } else {
                return `${namespace} ${className} {\n${parseToStylesheet(style)}\n}`
            }
        }).join('\n');
    }).join('\n');
    styleDom.innerHTML = content;
}

export function getInnerText(dom) {
    return (typeof dom.textContent == "string") ? dom.textContent : dom.innerText;
}
export function setInnerText(dom, text) {
    if (typeof dom.textContent == "string") {
        dom.textContent = text;
    } else {
        dom.innerText = text;
    }
}
export function insert(parent: HTMLElement | Node, newDom: HTMLElement | Node) {
    if (parent && newDom) {
        let first;
        const count = countChildNodes(parent);
        for (let i = 0; i < count; i++) {
            const item = parent.childNodes.item(i);
            if (item) {
                first = item;
                break;
            }
        }
        first ? parent.insertBefore(newDom, first) : parent.appendChild(newDom);
    }
}
export function insertBefore(newDom: HTMLElement | Node, existingDom: HTMLElement | Node) {
    if (existingDom && newDom && existingDom.parentNode !== null) {
        existingDom.parentNode.insertBefore(newDom, existingDom);
    }
}
export function insertAfter(newDom: HTMLElement | Node, existingDom: HTMLElement | Node) {
    if (existingDom && newDom && existingDom.parentNode !== null) {
        const parent = existingDom.parentNode;
        existingDom = nextNode(existingDom);
        if (existingDom) {
            parent.insertBefore(newDom, existingDom);
        } else {
            parent.appendChild(newDom);
        }
    }
}
export function nextChild(existingDom: HTMLElement | Node): HTMLElement {
    if (existingDom && existingDom.parentNode !== null) {
        const count = countChildren(existingDom.parentNode as HTMLElement);
        for (let i = 0; i < count; i++) {
            const item = (existingDom.parentNode as HTMLElement).children.item(i);
            if (item === existingDom) {
                return (existingDom.parentNode as HTMLElement).children.item(i + 1) as HTMLElement;
            }
        }
    }
    return null;
}
export function nextNode(existingDom: HTMLElement | Node): Node {
    if (existingDom && existingDom.parentNode !== null) {
        const count = countChildNodes(existingDom.parentNode as HTMLElement);
        for (let i = 0; i < count; i++) {
            const item = (existingDom.parentNode as HTMLElement).childNodes.item(i);
            if (item === existingDom) {
                return (existingDom.parentNode as HTMLElement).childNodes.item(i + 1);
            }
        }
    }
    return null;
}
export function childAt(container: HTMLElement, index): HTMLElement {
    if (container) {
        return container.children.item(index) as HTMLElement;
    }
}
export function removeMe(dom) {
    if (!dom) return;
    if (typeof dom.remove === 'function') {
        dom.remove();
    } else {
        if (dom.parentNode !== null) dom.parentNode.removeChild(dom);
    }
}
export function eachChildren(dom: HTMLElement, fn: (el: HTMLElement, index) => void, fromIndex?: number) {
    if (dom) {
        fromIndex = fromIndex && fromIndex !== -1 ? fromIndex : 0;
        const count = dom.children.length;
        const array = [];
        for (let i = fromIndex; i < count; i++) {
            array.push(dom.children.item(i));
        }
        for (let i = 0; i < array.length; i++) {
            fn && fn(array[i] as HTMLElement, i + fromIndex);
        }
    }
}
export function countChildren(dom: HTMLElement): number {
    if (dom) {
        return dom.children.length;
    } else {
        return 0;
    }
}
export function countChildNodes(dom: HTMLElement | Node): number {
    if (dom) {
        return dom.childNodes.length;
    } else {
        return 0;
    }
}

export function findMetaElement(metaName: string): HTMLMetaElement {
    if (isBrowser && window.document && window.document.head && window.document.head.getElementsByTagName) {
        // 获取meta
        const metas = window.document.head.getElementsByTagName('meta');
        if (metas && metas.length) {
            for (let i = 0; i < metas.length; i++) {
                const meta = metas.item(i);
                const name = meta.getAttribute('name');
                if (name === metaName) {
                    return meta;
                }
            }
        }
    }
    return null;
}

// t: 当前时间（已经经过的时间）d: 总时长
const easeOutCubic = function (t, d, from, to) {
    if (from === to) return to;
    const b = 0, c = 1;
    const v = c * ((t = t / d - 1) * t * t + 1) + b;
    return from + v * (to - from);
};

export function scrollToDom(dom: HTMLElement, scrollContainer: HTMLElement, duration = 240, delay = 0) {
    scrollContainer['__stopVScrollAnimation'] && scrollContainer['__stopVScrollAnimation']();
    const done = () => {
        scrollContainer['__stopVScrollAnimation'] && scrollContainer['__stopVScrollAnimation']();
        delete scrollContainer['__stopVScrollAnimation'];
        // 最后重新计算，防止滚动过程中容器内容变化产生的位置误差
        scrollContainer.scrollTop = originScrollTop(dom, scrollContainer);
    }
    if (!duration) {
        done();
    } else {
        let timer;
        const delayTime = setTimeout(() => {
            const domScrollTop = originScrollTop(dom, scrollContainer);
            const start = scrollContainer.scrollTop;
            const startTime = (new Date()).getTime();
            timer = setInterval(() => {
                const currentTime = (new Date()).getTime() - startTime;
                if (currentTime >= duration) {
                    done();
                } else {
                    scrollContainer.scrollTop = easeOutCubic(currentTime, duration, start, domScrollTop);
                }
            }, 42); // 24 帧 / 秒
        }, delay);
        scrollContainer['__stopVScrollAnimation'] = () => {
            clearTimeout(delayTime);
            clearInterval(timer);
        }
    }
};

const globalScrollLeft = function (dom) {
    return (dom.parentNode && dom.parentNode !== document) ? dom.parentNode.scrollLeft + globalScrollLeft(dom.parentNode) : 0;
};

const globalScrollTop = function (dom) {
    return (dom.parentNode && dom.parentNode !== document) ? dom.parentNode.scrollTop + globalScrollTop(dom.parentNode) : 0;
};

const gX = function (dom) {
    return dom.offsetParent ? dom.offsetLeft + gX(dom.offsetParent) : dom.offsetLeft;
};

const gY = function (dom) {
    return dom.offsetParent ? dom.offsetTop + gY(dom.offsetParent) : dom.offsetTop;
};
/**
 * dom全局X坐标。
 **/
export function globalX(dom) {
    return gX(dom) - globalScrollLeft(dom);
}
/**
 * dom全局Y坐标。
 **/
export function globalY(dom) {
    return gY(dom) - globalScrollTop(dom);
}
/**
 * dom相对于target的ｘ坐标
 */
export function contentX(dom, target) {
    return globalX(dom) - globalX(target);
}
/**
 * dom相对于target的ｙ坐标
 */
export function contentY(dom, target) {
    return globalY(dom) - globalY(target);
}
/**
 * dom相对于container内容的ｙ位置
 */
export function originScrollTop(dom, container) {
    const scrollTop = container.scrollTop;
    const offsetTop = contentY(dom, container);
    return scrollTop + offsetTop;
}
export function transformScale(dom: HTMLElement) {
    if (!dom) return 1;
    const originTransform = dom.style.transform;
    if  (originTransform) {
        const result = originTransform.match(/scale\((.*?)\)/);
        if (result && result[1]) {
            const arr: any = result[1].trim().split(',');
            arr.forEach((str, index) => { arr[index] = parseFloat(str); });
            if (arr.length) {
                return arr[0];
            }
        }
    }
    return 1;
}
/**
 * 获取剪贴板中的数据
 */
export function getClipboardData(event: ClipboardEvent): Promise<any> {
    let clipboardData = event ? (event.clipboardData || (event['originalEvent'] ? event['originalEvent'].clipboardData : null)) : null;
    clipboardData = clipboardData || window['clipboardData'];
    const result = {};
    if (clipboardData && clipboardData.items) {
        const readText = (item) => {
            return new Promise((resolve, reject) => {
                item.getAsString((s) => {
                    result['text'] = s;
                    resolve();
                });
            });
        }
        const readHTML = (item) => {
            return new Promise((resolve, reject) => {
                item.getAsString((s) => {
                    result['html'] = s;
                    resolve();
                });
            });
        }
        const readImage = (item) => {
            result['image'] = item.getAsFile();
            return Promise.resolve();
        }
        const len = clipboardData.items.length;
        const promiese = [];
        for (var i = 0; i < len; i++) {
            const item = clipboardData.items[i];
            if (item && item.type) {
                if ((item.kind == 'string') && (item.type.match('^text/plain'))) {
                    promiese.push(readText(item));
                } else if ((item.kind == 'string') && (item.type.match('^text/html'))) {
                    promiese.push(readHTML(item));
                } else if ((item.kind == 'file') && (item.type.match('^image/'))) {
                    promiese.push(readImage(item));
                } else {
                    // skip
                }
            }
        }
        return Promise.all(promiese).then(() => Promise.resolve(result)).catch(() => Promise.resolve(result));
    } else {
        return Promise.resolve(result);
    }
}

const css3DetectDom = (isBrowser && document && typeof document.createElement === 'function') ? document.createElement('div') : null;
const vendors = ['Ms', 'O', 'Moz', 'Webkit'];
export function css3Supported(property) {
    if (!css3DetectDom || !property) return false;
    property = cssProp2Prop(property);
    if (property in css3DetectDom.style) return true;
    property = property.replace(/^[a-z]/, function(val) {
        return val.toUpperCase();
    });
    let len = vendors.length;
    while(len--) {
        const prop = vendors[len] + property;
        if (prop in css3DetectDom.style) {
            return true;
        } 
    }
    return false;
};
// -----------------------------------------------------------------------------
// 全屏控制
// =============================================================================
const keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;
const api: any = {};
(function () {
    const document = isBrowser ? window.document : {};
    const apiNames = [
        [
            'requestFullscreen',
            'exitFullscreen',
            'fullscreenElement',
            'fullscreenEnabled',
            'fullscreenchange',
            'fullscreenerror'
        ],
        // New WebKit
        [
            'webkitRequestFullscreen',
            'webkitExitFullscreen',
            'webkitFullscreenElement',
            'webkitFullscreenEnabled',
            'webkitfullscreenchange',
            'webkitfullscreenerror'
    
        ],
        // Old WebKit (Safari 5.1)
        [
            'webkitRequestFullScreen',
            'webkitCancelFullScreen',
            'webkitCurrentFullScreenElement',
            'webkitCancelFullScreen',
            'webkitfullscreenchange',
            'webkitfullscreenerror'
    
        ],
        [
            'mozRequestFullScreen',
            'mozCancelFullScreen',
            'mozFullScreenElement',
            'mozFullScreenEnabled',
            'mozfullscreenchange',
            'mozfullscreenerror'
        ],
        [
            'msRequestFullscreen',
            'msExitFullscreen',
            'msFullscreenElement',
            'msFullscreenEnabled',
            'MSFullscreenChange',
            'MSFullscreenError'
        ]
    ];
    
    let i = 0, val;
    for (; i < apiNames.length; i++) {
        val = apiNames[i];
        if (val && val[1] in document) {
            for (i = 0; i < val.length; i++) {
                api[apiNames[0][i]] = val[i];
            }
        }
    }
})();

const eventNameMap = {
    change: api.fullscreenchange,
    error: api.fullscreenerror
};

export const fullscreen = {
    _events: {},
    isFullscreen: function () {
        return !!document[api.fullscreenElement];
    },
    element: function () {
        return document[api.fullscreenElement];
    },
    supported: function () {
        return !isEmpty(api) && !!document[api.fullscreenEnabled];
    },
    request: function (elem?) {
        return new Promise((resolve) => {
            const request = api.requestFullscreen;
            const onFullScreenEntered = () => {
                fullscreen.off('change', onFullScreenEntered);
                resolve();
            };
            elem = elem || document.documentElement;
            if (/ Version\/5\.1(?:\.\d+)? Safari\//.test(navigator.userAgent)) {
                elem[request]();
            } else {
                elem[request](keyboardAllowed ? Element['ALLOW_KEYBOARD_INPUT'] : {});
            }
            fullscreen.on('change', onFullScreenEntered);
        });
    },
    exit: function () {
        return new Promise((resolve) => {
            if (!fullscreen.isFullscreen()) {
                resolve();
                return;
            }
            var onFullScreenExit = () => {
                fullscreen.off('change', onFullScreenExit);
                resolve();
            };
            document[api.exitFullscreen]();

            fullscreen.on('change', onFullScreenExit);
        });
    },
    toggle: function (elem?) {
        return fullscreen.isFullscreen() ? fullscreen.exit() : fullscreen.request(elem);
    },
    onchange: function (callback) {
        fullscreen.on('change', callback);
    },
    onerror: function (callback) {
        fullscreen.on('error', callback);
    },
    on: function (event, callback) {
        var eventName = eventNameMap[event];
        if (eventName) {
            if (!this._events[eventName]) {
                this._events[eventName] = {
                    handlers: [],
                    removeListening: [],
                }
            }
            if (this._events[eventName].handlers.indexOf(callback) === -1) {
                this._events[eventName].handlers.push(callback);
                this._events[eventName].removeListening.push(
                    addEventListener(document, eventName, callback)
                )
            }
        }
    },
    off: function (event, callback) {
        var eventName = eventNameMap[event];
        if (eventName) {
            if (this._events[eventName]) {
                const index = this._events[eventName].handlers.indexOf(callback);
                if (index !== -1) {
                    this._events[eventName].removeListening[index]();
                    this._events[eventName].handlers.splice(index, 1);
                    this._events[eventName].removeListening.splice(index, 1);
                }
            }
        }
    }
};

export function simulatedDownload(options: { url: string, method: string, data?: any, target?: string }) {
    if (!isBrowser) {
        return;
    }
    const doc = window.document;
    const form: any = doc.createElement('form');
    form.setAttribute('method', options.method);
    form.setAttribute('action', options.url);
    // form.setAttribute('enctype' , 'multipart/form-data');
    form.style.display = 'none';
    if (options.data) {
        for (const key in options.data) {
            let value = options.data[key];
            value = (value === null || value === undefined) ? '' : value;
            if (isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    let val = value[i];
                    val = (typeof val === 'string') ? val : JSON.stringify(val);
                    const input = doc.createElement('input');
                    input.setAttribute('type', 'hidden');
                    input.setAttribute('name', `${key}`);
                    input.setAttribute('value', val);
                    form.appendChild(input);
                }
            } else {
                value = (typeof value === 'string') ? value : JSON.stringify(value);
                const input = doc.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', `${key}`);
                input.setAttribute('value', value);
                form.appendChild(input);
            }
        }
    }
    doc.body.appendChild(form);
    form.submit();
    doc.body.removeChild(form);
}

export function simulateMouseEvent(target: HTMLElement | Element, name: string, params?: any) {  
    if (!isBrowser) {
        return;
    }
    if (!target || !name) {
        return;
    }
    params = params || {};
    // 获取浏览器版本
    let isIE: any = window.navigator && window.navigator.userAgent ? window.navigator.userAgent.match(/MSIE (\d)/i) : false, e: any;
    isIE = isIE ? isIE[1] : undefined;
    if (isIE < 9) {
        e = document['createEventObject']();
    } else {
        e = document['createEvent']('MouseEvents');
        e.initMouseEvent(name, true, true, window, 1, 0, 0, 0, 0, false, false, true, false, 0, null);
    }
    // 给事件对象添加属性
    for (const prop in params) {
        e[prop] = params[prop];
    }
    // 触发事件
    if (isIE < 9) {
        target['fireEvent']('on' + name, e);
    } else {
        target.dispatchEvent(e);
    }
}

export function getCursorRange(elem: HTMLInputElement): [number, number] {
    if (document['selection']) {
        //IE
        var range = document['selection'].createRange();
        const text = range.text || '';
        range.moveStart("character", -elem.value.length);
        var len = range.text.length;
        return [len, text.length];
    } else {
        return [elem.selectionStart, elem.selectionEnd];
    }
}

export function getCursorSelection(elem: HTMLInputElement) {
    if (document['selection']) {
        //IE
        var range = document['selection'].createRange();
        return range.text;
    } else {
        return elem.value.substring(elem.selectionStart, elem.selectionEnd);
    }
}

export function setCursorSelection(elem: HTMLInputElement, start, end) {
    if (document['selection']) {
        // IE
        var range = elem['createTextRange']();
        range.move("character", -elem.value.length);
        range.moveEnd("character", start);
        range.moveStart("character", end);
        range.select();
    } else {
        elem.setSelectionRange(start, end);
    }
}
export function replaceCursorTextRange(elem: HTMLInputElement, text: string, range: [number, number]) {
    text = text || '';
    const value = elem.value;
    const startIndex = range[0] || 0;
    let endIndex = range[1] || 0;
    const pre = value.substring(0, startIndex);
    const suf = value.substring(endIndex);

    elem.value = `${pre}${text}${suf}`;
    endIndex = startIndex + text.length;
    setCursorSelection(elem, startIndex, endIndex);
}
export function replaceCursorText(elem: HTMLInputElement, text: string) {
    text = text || '';
    const range = getCursorRange(elem);
    replaceCursorTextRange(elem, text, range);
}