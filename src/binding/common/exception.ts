
// const httpCode2Message = {
//     0: '您的网络可能已经断开，请检查网络连接，然后重试',
//     200: '',
//     201: '指定资源已经存在',
//     204: '指定资源不存在',
//     401: '登录信息已失效',
//     403: '指定资源的访问权限不足',
//     404: '未找到指定资源',
//     500: '服务器发生内部错误，请稍后重试',
//     501: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
//     502: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
//     503: '服务暂时不可用，服务器可能正在维护或已被暂停，请联系管理员尝试解决',
//     504: '请求无法到达服务器，请检查与服务器的通信状态后重试',
//     505: 'Http的版本是不受支持的，请检查浏览器Http版本设置',
// }

// function httpCodeToMessage(code) { return httpCode2Message[code] || ''; }
export function errorToMessage(error: any, defaultMsg?: string): string {
    if (!error) return defaultMsg || '查询异常';
    if (typeof error === 'string') {
        // 尝试处理响应为json的error结构
        try {
            const errorJson = JSON.parse(error);
            if ('message' in errorJson) {
                return errorJson.message;
            } else if ('msg' in errorJson) {
                return errorJson.msg;
            } else {
                return error;
            }
        } catch (e) {
            return error;
        }
    } else if (error instanceof Error) {
        return error.message || defaultMsg || error.stack || '';
    }
    // 模糊处理
    if (error && typeof error === 'object') {
        if (typeof error.message === 'string') {
            return error.message || defaultMsg || '';
        } else if (typeof error.msg === 'string') {
            return error.msg || defaultMsg || '';
        } else if (error.error) {
            return errorToMessage(error.error, defaultMsg);
        }
    }
    return defaultMsg || '';
}