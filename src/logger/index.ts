import { isBrowser, globalContext, globalCache } from 'neurons-utils';
import { removeMe, addEventListener } from 'neurons-dom';

const browserGhostEnabled = isBrowser
                            && typeof window.document !== 'undefined'
                            && typeof window.document.createElement === 'function';
const logFn = (console && typeof console.log === 'function') ? console.log : () => {}; 
const warnFn = (console && typeof console.warn === 'function') ? console.warn : () => {}; 
const errorFn = (console && typeof console.error === 'function') ? console.error : () => {};

export enum LogLevel {
    info = 'info',
    warn = 'warn',
    error = 'error',
}

export interface ILoggerConfig {
    appId?: string;
    appName?: string;
    mode?: 'ghost' | 'console';
}

export interface ILogBody {
    appId: string;
    appName: string;
    timestamp: number;
    moduleName: string;
    level: LogLevel;
    contents: (string | number | any)[];
}

export interface ILogger {
    log(...args: any[]);
    warn(...args: any[]);
    error(...args: any[]);
}

const _cache: ILogBody[]  = globalCache('app-logger', []);

!globalContext.showLogHistory && (globalContext.showLogHistory = () => {
    const history = _cache.concat();
    logFn(history);
});
!globalContext.showLatestHistory && (globalContext.showLatestHistory = () => {
    _cache[0] && logFn(_cache[0]);
});
!globalContext.showLogHistoryInfo && (globalContext.showLogHistoryInfo = () => {
    if (!_cache[0]) {
        logFn('Not any logs.');
        return;
    }
    const count = _cache.length;
    const start = new Date();
    start.setTime(_cache[count - 1].timestamp);
    const end = new Date();
    end.setTime(_cache[0].timestamp)
    logFn(`在 ${start.toISOString()} 到 ${end.toISOString()} 之间, 共产生 ${count} 条记录`);
});

if (browserGhostEnabled) {
    let unRegisterLisener, shown = false, logDom: HTMLElement, closeDom: HTMLElement;
    const createLogItem = (item: ILogBody) => {
        const dom = window.document.createElement('div');
        dom.style.cursor = 'pointer';
        dom.style.borderBottom = 'solid 1px rgba(0,0,0,0.06)';
        dom.style.width = '100%';
        dom.style.lineHeight = '22px';
        const d = new Date();
        d.setTime(item.timestamp);
        const str = item.appName ? `[ ${item.appName} ] [ ${item.moduleName} ] [ ${d.toISOString()} ] ${item.level.toUpperCase()}: ` : `[ ${item.moduleName} ] [ ${d.toISOString()} ] ${item.level.toUpperCase()}: `;
        const bgcolor = item.level === LogLevel.error ? 'rgba(244, 67, 54, 0.5)'
                        : item.level === LogLevel.warn ? 'rgba(255, 193, 7, 0.5)'
                        : 'rgba(212, 212, 212, 0.5)';
        const contents = (item.contents || []).map((value) => {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (value instanceof Error) {
                return `${value.name.toUpperCase()} ${value.message}: </br> ${value.stack}`;
            }
            try {
                return JSON.stringify(value)
            } catch (error) {}
            return value;
        })
        dom.innerHTML = `<div style="background-color: ${bgcolor}">${str}</div><div>${contents.join('</br>')}</div>`;
        dom.onclick = () => {
            logFn.call(null, item);
        }
        return dom;
    }
    const hideLogs = () => {
        if (!shown) return;
        shown = false;
        removeMe(logDom);
        removeMe(closeDom);
    }
    const showLogs = () => {
        if (shown) return;
        if (!window.document.body) return;
        shown = true;
        logDom = window.document.createElement('div');
        logDom.style.position = 'absolute';
        logDom.style.top = '36px';
        logDom.style.bottom = '0';
        logDom.style.left = '0';
        logDom.style.right = '0';
        logDom.style.overflow = 'auto';
        logDom.style.border = 'solid 1px rgba(0,0,0,0.06)';
        logDom.style.backgroundColor = '#FFFFFF';
        logDom.style.color = '#000000';
        logDom.style.zIndex = '99999999999';
        closeDom = window.document.createElement('div');
        closeDom.style.position = 'absolute';
        closeDom.style.top = '0';
        closeDom.style.left = '0';
        closeDom.style.right = '0';
        closeDom.style.height = '36px';
        closeDom.style.lineHeight = '36px';
        closeDom.style.textAlign = 'center';
        closeDom.style.fontSize = '16px';
        closeDom.style.cursor = 'pointer';
        closeDom.style.backgroundColor = '#FFFFFF';
        closeDom.style.color = 'rgba(0, 0, 0, 0.5)';
        closeDom.style.zIndex = '99999999999';
        closeDom.innerHTML = '⇊ 收起 ⇊';
        closeDom.onclick = () => {
            hideLogs();
        }
        if (!_cache.length) {
            logDom.innerHTML = '无记录.'
        } else {
            _cache.forEach(item => {
                logDom.appendChild(createLogItem(item));
            });
        }
        window.document.body.appendChild(closeDom);
        window.document.body.appendChild(logDom);
    }
    const toggleLogs = () => {
        shown ? hideLogs() : showLogs();
    }
    !('logDisplayActived' in globalContext) && (globalContext.logDisplayActived = false);
    !globalContext.activeLogDisplay && (globalContext.activeLogDisplay = () => {
        globalContext.logDisplayActived = true;
        unRegisterLisener && unRegisterLisener();
        // ctrl + shift + l
        const lisener = addEventListener(window, 'keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey &&  e.keyCode === 76) {
                toggleLogs();
            }
        });
        unRegisterLisener = () => {
            lisener();
            hideLogs()
        };
        return '使用 ctrl + shift + l 组合键查看日志';
    });
    !globalContext.deactiveLogDisplay && (globalContext.deactiveLogDisplay = () => {
        globalContext.logDisplayActived = false;
        unRegisterLisener && unRegisterLisener();
        unRegisterLisener = null;
    });
}

const _putHistory = function (body: ILogBody) {
    if (!body) return;
    _cache.unshift(body);
    if (_cache.length > 200) {
        _cache.pop();
    }
}
const _composeConsoleLogHeader = function (appName, moduleName, args: any[]) {
    const d = (new Date());
    const timestamp = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    const str = appName
        ? `[ ${appName} ] [ ${moduleName} ] [ ${timestamp} ]: `
        : moduleName
        ? `[ ${moduleName} ] [ ${timestamp} ]: `
        : `[ ${timestamp} ]: `;
    args.unshift(str);
    return args;
}

function log(moduleName, contents: any[]) {
    const appId = LoggerFactory._config.appId || '',
        appName = LoggerFactory._config.appName || '';
    moduleName = moduleName || '';
    _putHistory({
        appId: appId,
        appName: appName,
        moduleName: moduleName,
        timestamp: (new Date()).getTime(),
        level: LogLevel.info,
        contents: contents || []
    });
    if (LoggerFactory._config.mode === 'console') {
        logFn.apply(null, _composeConsoleLogHeader(appName, moduleName, contents));
    }
}
function warn(moduleName, contents: any[]) {
    const appId = LoggerFactory._config.appId || '',
        appName = LoggerFactory._config.appName || '';
    moduleName = moduleName || '';
    _putHistory({
        appId: appId,
        appName: appName,
        moduleName: moduleName,
        timestamp: (new Date()).getTime(),
        level: LogLevel.warn,
        contents: contents || []
    });
    if (LoggerFactory._config.mode === 'console') {
        warnFn.apply(null, _composeConsoleLogHeader(appName, moduleName, contents));
    }
}
function error(moduleName, contents: any[]) {
    const appId = LoggerFactory._config.appId || '',
        appName = LoggerFactory._config.appName || '';
    moduleName = moduleName || '';
    _putHistory({
        appId: appId,
        appName: appName,
        moduleName: moduleName,
        timestamp: (new Date()).getTime(),
        level: LogLevel.error,
        contents: contents || []
    });
    if (LoggerFactory._config.mode === 'console') {
        errorFn.apply(null, _composeConsoleLogHeader(appName, moduleName, contents));
    }
}

export class Logger implements ILogger {
    constructor(protected _moduleName: string) {}
    log(...contents: any[]) {
        log(this._moduleName, contents);
    }
    warn(...contents: any[]) {
        warn(this._moduleName, contents);
    }
    error(...contents: any[]) {
        error(this._moduleName, contents);
    }
}

export class LoggerFactory {
    static _config: ILoggerConfig = {};
    static _beforeConfigLoggers = [];
    static config(value: ILoggerConfig) {
        LoggerFactory._config = value || {};
    }
    static getLogger(moduleName: string): ILogger {
        if (!moduleName) return null;
        return new Logger(moduleName);
    }
}
