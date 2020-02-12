import { ObservableLike, isEmpty, isDefined, isFormData, isBlob, isArrayBuffer } from 'neurons-utils';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';

export interface IRequestOption {
    body?: any;
    headers?: { [header: string]: string | string[] };
    params?: { [param: string]: string | string[] };
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
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
export interface IProgressEvent {
    filename: string;
    loaded: number;
    total: number;
    percent: number;
}
export interface IHttpProgress {
    retry: () => void;
    about: () => void;
    progress: IEmitter<IProgressEvent>;
    completed: IEmitter<IProgressEvent>;
    canceled: IEmitter<IProgressEvent>;
    failed: IEmitter<Error>;
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

function composeUrl(url: string, params: { [param: string]: string | string[] }): string {
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
function setRequestHeaders(headers: { [header: string]: string | string[] }, callback: (key: string, value: string) => void): void {
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
function sendXHR(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    option: IRequestOption,
    success: (value?: any) => void,
    fail: (reason?: any) => void,
    uploadProgress?: (e) => void
) {
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
        about && about();
        success(result);
    }
    const doReject = (error) => {
        about && about();
        fail(error);
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
                    } else {
                        doResolve(body);
                    }
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
    uploadProgress && xhr.upload.addEventListener('progress', uploadProgress);
    xhr.send(reqBody);

    about = () => {
        xhr.removeEventListener('load', onSuccess);
        xhr.removeEventListener('error', onFail);
        uploadProgress && xhr.upload.removeEventListener('progress', uploadProgress);
        xhr.abort();
    };
    return about;
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
    upload(url: string, formKey: string, file: File, option?: IRequestOption): IHttpProgress {
        const nativeEmitter = new EventEmitter();
        const event: IProgressEvent = {
            filename: file && file.name ? file.name : '',
            loaded: 0,
            total: file && file.size ? file.size : 0,
            percent: 0,
        }
        option = option || {};
        const formData = new FormData();
        formData.append(formKey, file);
        option.body = formData;
        let progress: IHttpProgress;

        function onProgress(e) {
            if (e.lengthComputable) {
                event.loaded = e.loaded;
                event.total = e.total;
                event.percent = event.total ? Math.round(event.loaded * 100 / event.total) : 0;
            }
            nativeEmitter.emit('progress', event);
        }
        function onSuccess(result?) {
            event.loaded = event.total;
            event.total = event.total;
            event.percent = 100;
            nativeEmitter.emit('completed', result);
        }
        function onFail(error) {
            nativeEmitter.emit('failed', error);
        }
        function send() {
            return sendXHR(url, 'POST', option, onSuccess, onFail, onProgress);
            // let num = 0;
            // const id = setInterval(() => {
            //     num += 1;
            //     if (num > 100) {
            //         onSuccess();
            //     } else if (num > 50) {
            //         onFail(new Error('asdfsdfasdf'));
            //         clearInterval(id);
            //     } else {
            //         onProgress({
            //             lengthComputable: true,
            //             loaded: num,
            //             total: 100,
            //         })

            //     }
            // }, 50);
        }
        let about;
        progress = {
            retry: () => {
                event.loaded = 0;
                event.percent = 0;
                about && about();
                about = send();
            },
            about: () => {
                nativeEmitter.emit('canceled', event);
                about && about();
            },
            progress: emitter('progress', nativeEmitter),
            completed: emitter('completed', nativeEmitter),
            canceled: emitter('canceled', nativeEmitter),
            failed: emitter('failed', nativeEmitter),
        }
        about = send();
        return progress;
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
            sendXHR(url, method, option, resolve, reject);
        });
    }
}