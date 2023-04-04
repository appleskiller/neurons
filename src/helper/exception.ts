
/**
 * Biz error code
 */
enum BizErrorCode {
    Created = 201,
    NoContent = 204,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    LoginRequired = 406,
}

const httpCode2Message = {
    0: '您的网络可能已经断开，请检查网络连接，然后重试',
    [BizErrorCode.Created]: '指定资源已经存在',
    [BizErrorCode.NoContent]: '指定资源不存在',
    [BizErrorCode.Unauthorized]: '登录信息已失效',
    [BizErrorCode.Forbidden]: '指定资源的访问权限不足',
    [BizErrorCode.NotFound]: '未找到指定资源',
    [BizErrorCode.LoginRequired]: '登录后可访问',
    500: '服务器发生内部错误，请稍后重试',
    501: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
    502: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
    503: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
    504: '请求无法到达服务器，请检查与服务器的通信状态后重试',
    505: 'Http的版本是不受支持的，请检查浏览器Http版本设置',
}

function httpCodeToMessage(code) { return httpCode2Message[code] || ''; }
function errorToMessage(error: any, defaultMsg?: string): string {
    if (!error) return defaultMsg || '查询异常';
    if (typeof error === 'string') {
        // 尝试处理响应为json的error结构
        try {
            const errorJson = JSON.parse(error);
            if ('message' in errorJson) {
                return errorJson.message;
            } else {
                return error;
            }
        } catch (e) {
            return error;
        }
    } else if ('status' in error && 'error' in error) {
        let msg: string = '';
        const code = error.status;
        if (code == 200) return '';
        msg = httpCodeToMessage(code);
        if (!msg) {
            return errorToMessage(error.error, defaultMsg);
        }
        return msg;
    } else if (error instanceof Error) {
        return error.message || defaultMsg || '';
    }
    // 模糊处理
    if (error && typeof error === 'object') {
        if (typeof error.message === 'string') {
            return error.message || defaultMsg || '';
        } else if (typeof error.msg === 'string') {
            return error.msg || defaultMsg || '';
        }
    }
    return defaultMsg || '';
}

function errorToStackText(error: any): string {
    if (!error) return '';
    if (typeof error === 'string') {
        // 尝试处理响应为json的error结构
        try {
            const errorJson = JSON.parse(error);
            return errorToStackText(errorJson);
        } catch (error) {
            return error;
        }
    } else if ('status' in error && 'error' in error) {
        return errorToStackText(error.error);
    } else if (error instanceof Error) {
        if (typeof error.stack === 'string') {
            return error.stack || '';
        } else {
            try {
                return JSON.stringify(error.stack);
            } catch (error) {
                return Object.prototype.toString.call(error.stack);
            }
        }
    }
    // 模糊处理
    if (error && typeof error === 'object') {
        if (typeof error.stack === 'string') {
            return error.stack || '';
        } else {
            try {
                return JSON.stringify(error.stack);
            } catch (error) {
                return Object.prototype.toString.call(error.stack);
            }
        }
    }
    return '';
}

export const exception = {
    errorToStackText: errorToStackText,
    errorToMessage: errorToMessage,
    /**
     * 转换异常code为用户提示信息
     */
    httpCodeToMessage: httpCodeToMessage,
    /**
     * 检查是否有请求异常
     */
    hasError: (error) => !(error && 'status' in error && error.status == 200),
    /**
     * 201 Created: 资源已经存在
     */
    isExists: (error) => !!(error && 'status' in error && error.status == BizErrorCode.Created),
    /**
     * 204 No Content: 资源不存在
     */
    isNoContent: (error) => !!(error && 'status' in error && error.status == BizErrorCode.NoContent),
    /**
     * 401 Unauthorized: 登录信息已失效
     */
    isUnauthorized: (error) => !!(error && 'status' in error && error.status == BizErrorCode.Unauthorized),
    /**
     * 403 Forbidden: 没有资源权限
     */
    isForbidden: (error) => !!(error && 'status' in error && error.status == BizErrorCode.Forbidden),
    /**
     * 404 Not Found: 未找到指定资源
     */
    isNotFound: (error) => !!(error && 'status' in error && error.status == BizErrorCode.NotFound),
    /**
     * 406 Need Login: 要求登录后访问资源
     */
    isLoginRequired: (error) => !!(error && 'status' in error && error.status == BizErrorCode.LoginRequired),
}

