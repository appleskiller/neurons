import { isBrowser } from './osutils';
import { findMetaElement } from './domutils';

// see: https://qydev.weixin.qq.com/wiki/index.php?title=JSAPI#.E7.BD.91.E9.A1.B5.E8.8E.B7.E5.8F.96.E7.94.A8.E6.88.B7.E7.BD.91.E7.BB.9C.E7.8A.B6.E6.80.81
declare const WeixinJSBridge: {
    call: (cmd: string) => void;
    invoke: (cmd: string, params: any, callback: (res: any) => void) => void;
}

declare const hasV8BreakIterator: any;

export interface IDeviceInfo {
    isBrowser: boolean,
    isMobile: boolean,

    isTrident: boolean,
    isEdge: boolean,
    isBlink: boolean,
    isWebKit: boolean,
    isFirefox: boolean,
    isSafari: boolean,

    isIOS: boolean,
    isIPhone: boolean,
    isIPad: boolean,
    isIPod: boolean,
    isAndroid: boolean,
    isWinMobile: boolean,
    // 移动客户端
    isWeixin: boolean; // 微信客户端
    isWeibo: boolean; // 微博客户端
    isQQSpace: boolean; // QQ空间客户端

    isOnline: boolean;
    isWeixinJSBridgeActived: boolean;
}

let deviceInfo;
export function detectDeviceInfo(): IDeviceInfo {
    if (!deviceInfo) {
        if (isBrowser && !!window.navigator && !!window.navigator.userAgent) {
            let ua = window.navigator.userAgent;
            const isTrident = /(msie|trident)/i.test(ua); //IE
            const isEdge = /(edge)/i.test(ua); // Edge
            const isBlink = (!!window['chrome'] && typeof CSS !== 'undefined' && !isEdge && !isTrident); // Chrome
            const isWebKit = /AppleWebKit/i.test(ua) && !isBlink && !isEdge && !isTrident;
            deviceInfo = {
                isBrowser: true,
                isMobile: /AppleWebKit.*Mobile.*/.test(ua), //是否为移动终端

                isTrident: isTrident,
                isEdge: isEdge,
                isBlink: isBlink,
                isWebKit: isWebKit,
                isFirefox: /(firefox|minefield)/i.test(ua),
                isSafari: /safari/i.test(ua) && isWebKit,

                isIOS: /iPad|iPhone|iPod/.test(ua) && !window['MSStream'],
                isIPhone: /iPhone/.test(ua) && !window['MSStream'], //是否为iPhone或者QQHD浏览器
                isIPad: /iPad/.test(ua) && !window['MSStream'], //是否iPad
                isIPod: /iPod/.test(ua) && !window['MSStream'], //是否iPad
                isAndroid: /android/i.test(ua) && !isTrident,
                isWinMobile: /windows mobile/i.test(ua),

                isOnline: ('onLine' in window.navigator) ? window.navigator.onLine : true,
            }
            if (deviceInfo.isMobile) {
                ua = ua.toLowerCase();
                let matched = ua.match(/MicroMessenger/i);
                deviceInfo.isWeixin = matched && (matched[0] == 'micromessenger');
                matched = ua.match(/WeiBo/i);
                deviceInfo.isWeibo = matched && (matched[0] == 'weibo');
                matched = ua.match(/QQ/i);
                deviceInfo.isQQSpace = matched && (matched[0] == 'qq');
            }
            deviceInfo.isWeixinJSBridgeActived = deviceInfo.isWeixin && typeof WeixinJSBridge === 'undefined';
        } else {
            deviceInfo = {
                isBrowser: false,
                isMobile: false,

                isTrident: false,
                isEdge: false,
                isBlink: false,
                isWebKit: false,
                isFirefox: false,
                isSafari: false,

                isIOS: false,
                isIPhone: false,
                isIPad: false,
                isIPod: false,
                isAndroid: false,
                isWinMobile: false,

                isWeixin: false,
                isWeibo: false,
                isQQSpace: false,

                isOnline: true,
                isWeixinJSBridgeActived: false,
            }
        }
    }
    return deviceInfo
}


export function setStatusBarColor(color: string) {
    const deviceInfomation = detectDeviceInfo();
    if (deviceInfomation.isMobile) {
        if (window && window.document && window.document.head) {
            let meta = findMetaElement('theme-color');
            if (!meta) {
                // chrome
                meta = window.document.createElement('meta');
                meta.setAttribute('name', 'theme-color');
                meta.setAttribute('content', color);
                window.document.head.appendChild(meta);
                // safari
                meta = window.document.createElement('meta');
                meta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
                meta.setAttribute('content', color);
                window.document.head.appendChild(meta);
                // win phone
                meta = window.document.createElement('meta');
                meta.setAttribute('name', 'msapplication-navbutton-color');
                meta.setAttribute('content', color);
                window.document.head.appendChild(meta);
            }
        }
    }
}

