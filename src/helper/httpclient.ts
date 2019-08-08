import { ObservableLike } from '../utils/asyncutils';
import { isEmpty, isDefined, isFormData, isBlob, isArrayBuffer } from '../utils/typeutils';

export interface IRequestOption {
    body?: any;
    headers?: {[header: string]: string | string[]};
    params?: {[param: string]: string | string[]};
    responseType?: 'arraybuffer'|'blob'|'json'|'text';
    withCredentials?: boolean;
    
    [key: string]: any;
}
export interface IHttpClient {
    get(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any;
    post(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any;
    put(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any;
    patch(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any;
    delete(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any;
}

export abstract class AbstractHttpClient implements IHttpClient {
    constructor(public requestHost: string = '') { }
    get(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> {
        throw new Error('Method not implemented.');
    }
    post(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> {
        throw new Error('Method not implemented.');
    }
    put(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> {
        throw new Error('Method not implemented.');
    }
    patch(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> | any {
        throw new Error('Method not implemented.'); 
    }
    delete(url: string, body?: any, option?: IRequestOption): ObservableLike<any> | PromiseLike<any> {
        throw new Error('Method not implemented.');
    }
}

function createXHR() {
    return new XMLHttpRequest();
}

function standardEncoding(v: string): string {
    return encodeURIComponent(v)
        .replace(/%40/gi, '@')
        .replace(/%3A/gi, ':')
        .replace(/%24/gi, '$')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%2B/gi, '+')
        .replace(/%3D/gi, '=')
        .replace(/%3F/gi, '?')
        .replace(/%2F/gi, '/');
}

function composeUrl(url: string, params: {[param: string]: string | string[]}): string {
    if (!params || isEmpty(params)) {
        return url;
    } else {
        const paramsString: string = Object.keys(params).map(key => {
            const eKey = standardEncoding(key);
            if (typeof params[key] === 'string') {
                return eKey + '=' + standardEncoding(params[key] as string);
            } else if (Array.isArray(params[key])) {
                return (params[key] as string[]).map(v => eKey + '=' + standardEncoding(v));
            } else {
                return eKey + '=';
            }
        }).join('&');
        const ind = url.indexOf('?');
        const sep: string = ind === -1 ? '?' : (ind < url.length - 1 ? '&' : '');
        return url + sep + paramsString;
    }
}
function setRequestHeaders(headers: {[header: string]: string | string[]}, callback: (key: string, value: string) => void): void {
    if (!headers || isEmpty(headers)) {
        return;
    }
    Object.keys(headers).forEach((key: string) => {
        // TODO normalize
        const value = headers[key];
        if (value) {
            if (typeof value === 'string') {
                callback(key, value);
            } else if (Array.isArray(value)) {
                callback(key, value.join(','));
            }
        }
    });
}
function detectedContentType(body: any): string {
    if (!isDefined(body)) return null;
    if (isFormData(body)) return null;
    if (isBlob(body)) return body.type || null;
    if (isArrayBuffer(body)) return null;
    if (typeof body === 'string') return 'text/plain';
    if (typeof body === 'object' || typeof body === 'number' || Array.isArray(body)) return 'application/json';
    return null;
}
function parseBody(body) {
    if (!isDefined(body)) return null;
    if (isArrayBuffer(body) || isBlob(body) || isFormData(body) || typeof body === 'string') return body;
    if (typeof body === 'object' || typeof body === 'boolean' || Array.isArray(body)) return JSON.stringify(body);
    return body.toString();
}
export class HttpClient extends AbstractHttpClient {
    constructor(public requestHost: string = '') {
        super(requestHost);
    }
    get(url: string, body?: any, option?: IRequestOption): Promise<any> {
        option = option || {};
        (option.body || body) && (option.body = option.body || body);
        return this._request(this.getUrl(url), 'GET', option);
    }
    post(url: string, body?: any, option?: IRequestOption): Promise<any> {
        option = option || {};
        (option.body || body) && (option.body = option.body || body);
        return this._request(this.getUrl(url), 'POST', option);
    }
    put(url: string, body?: any, option?: IRequestOption): Promise<any> {
        option = option || {};
        (option.body || body) && (option.body = option.body || body);
        return this._request(this.getUrl(url), 'PUT', option);
    }
    delete(url: string, body?: any, option?: IRequestOption): Promise<any> {
        option = option || {};
        (option.body || body) && (option.body = option.body || body);
        return this._request(this.getUrl(url), 'DELETE', option);
    }
    patch(url: string, body?: any, option?: IRequestOption): Promise<any> {
        option = option || {};
        (option.body || body) && (option.body = option.body || body);
        return this._request(this.getUrl(url), 'PATCH', option);
    }
    private getUrl(url) {
        if (/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g.test(url)) {
            return url;
        } else if (this.requestHost) {
            let host = this.requestHost;
            if (host.charAt(url.length - 1) === '/') host = host.substr(0, url.length - 1);
            if (url.charAt(0) === '/') url = url.substr(1);
            return `${host}/${url}`;
        } else {
            return url;
        }
    }
    private _request(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', option: IRequestOption): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = createXHR();
            const urlWithParams = composeUrl(url, option.params);
            xhr.open(method, urlWithParams);
            if (!!option.withCredentials) {
                xhr.withCredentials = true;
            }
            let hasAccept;
            setRequestHeaders(option.headers, (key: string, value: string) => {
                xhr.setRequestHeader(key, value);
                if (key === 'Accept') hasAccept = true;
                if (key === 'Content-Type') hasAccept = true;
            });
            !hasAccept && xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
            const detectedType = detectedContentType(option.body);
            if (detectedType) {
                xhr.setRequestHeader('Content-Type', detectedType);
            }
            option.responseType && (xhr.responseType = option.responseType.toLowerCase() as any);
            const reqBody = parseBody(option.body);
            let about = null;
            const doResolve = (result) => {
                about();
                resolve(result);
            }
            const doReject = (error) => {
                about();
                reject(error);
            }
            const onSuccess = function () {
                let status = xhr.status == 1223 ? 204 : xhr.status;
                const statusText = xhr.statusText || 'OK';
                let body = null;
                if (status != 204) {
                    body = (typeof xhr.response === 'undefined') ? xhr.responseText : xhr.response;
                }
                if (status == 0) {
                    status = !!body ? 200 : 0;
                }
                if (status == 200) {
                    switch (option.responseType) {
                        case 'arraybuffer':
                            if (!isArrayBuffer(body)) {
                                doReject(new Error('Response is not an ArrayBuffer.'));
                            } else {
                                doResolve(body);
                            }
                            break;
                        case 'blob':
                            if (!isBlob(body)) {
                                doReject(new Error('Response is not an Blob.'));
                            } else {
                                doResolve(body);
                            }
                            break;
                        case 'text':
                            if (!isDefined(body) && typeof body !== 'string') {
                                doReject(new Error('Response is not an string.'));
                            } else {
                                doResolve(body);
                            }
                            break;
                        case 'json':
                            if (typeof body === 'string') {
                                try {
                                    body = body !== '' ? JSON.parse(body) : null;
                                } catch (error) {
                                    doReject(error);
                                    return;
                                }
                            }
                            // 检查是否是标准业务响应结构
                            if ('ok' in body && ('data' in body || 'msg' in body)) {
                                if (!!body.ok) {
                                    doResolve(body.data);
                                } else {
                                    doReject(new Error(body.msg || ''));
                                }
                            } else {
                                doResolve(body);
                            }
                            break;
                        default:
                            // GET 请求中如果不设置responseType, 则尝试检查response向JSON数据转化
                            const headers = xhr.getAllResponseHeaders() || '';
                            if (typeof body === 'string' && headers.toLowerCase().indexOf('content-type: application/json') !== -1) {
                                try {
                                    body = body !== '' ? JSON.parse(body) : null;
                                } catch (error) {
                                    doReject(error);
                                    return;
                                }
                                // 检查是否是标准业务响应结构
                                if ('ok' in body && ('data' in body || 'msg' in body)) {
                                    if (!!body.ok) {
                                        doResolve(body.data);
                                    } else {
                                        doReject(new Error(body.msg || ''));
                                    }
                                } else {
                                    doResolve(body);
                                }
                            }
                            doResolve(body);
                            break;
                    }
                } else {
                    doReject({
                        status: status,
                        statusText: statusText,
                        url: url || undefined,
                        error: body
                    });
                }
            };
            const onFail = function (error) {
                doReject({
                    status: xhr.status,
                    statusText: xhr.statusText || 'Unknown Error',
                    url: url || undefined,
                    error: error,
                });
            };
            xhr.addEventListener('load', onSuccess);
            xhr.addEventListener('error', onFail);
            xhr.send(reqBody);
    
            about = () => {
                xhr.removeEventListener('load', onSuccess);
                xhr.removeEventListener('error', onFail);
                xhr.abort();
            };
        });
    }
}