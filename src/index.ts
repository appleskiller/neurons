
// import './polyfill';

export { LoggerFactory } from './logger';
export { HttpClient } from './helper/httpclient';
// -------------------------------------------------------------------
// datatype
// ===================================================================
import * as datatypeExports from './datatype';
export const datatype = datatypeExports;
// -------------------------------------------------------------------
// binding
// ===================================================================
export * from './binding';
// -------------------------------------------------------------------
// cdk
// ===================================================================
export * from './cdk';
// -------------------------------------------------------------------
// components
// ===================================================================
export * from './components';
// -------------------------------------------------------------------
// utils
// ===================================================================
// import * as baseUtils from 'neurons-utils';
// import * as animationutils from 'neurons-animation';
// import * as domutils from 'neurons-dom';
// import * as xmlutils from 'neurons-xml';

// export const utils = {
//     ...baseUtils,
//     dom: domutils,
//     xml: xmlutils,
//     animation: animationutils,
// };
// -------------------------------------------------------------------
// others
// ===================================================================
// export * from 'neurons-emitter';
// export { injector } from 'neurons-injector';
// -------------------------------------------------------------------
// global export
// ===================================================================
// import * as emitterExports from 'neurons-emitter';
// import { injector } from 'neurons-injector';
// import { LoggerFactory } from './logger';
// import { HttpClient } from './helper/httpclient';
// import * as datatypeExports from './datatype';
// import * as bindingExports from './binding';
// import * as cdkExports from './cdk';
// import * as componentsExports from './components';
// if (!utils.globalContext['neurons']) {
//         const globalExports = {
//         ...emitterExports,
//         injector: injector,
//         LoggerFactory: LoggerFactory,
//         HttpClient: HttpClient,
//         ...datatypeExports,
//         ...bindingExports,
//         ...cdkExports,
//         ...componentsExports,
//         utils: utils,
//     }
//     utils.globalContext['neurons'] = globalExports;
// }