import './polyfill';

import * as hierarchy from './datatype/hierarchy';
// -------------------------------------------------------------------
// utils
// ===================================================================
import * as hierarchycollection from './datatype/hierarchycollection';
import * as hierarchygrid from './datatype/hierarchygrid';
import * as helper_emitter from './helper/emitter';

// ----------------------------------------------------
// helper
// ====================================================
import * as helper_httpclient from './helper/httpclient';
import * as helper_injector from './helper/injector';
import { fontLoader, scriptLoader } from './helper/loader';
// -------------------------------------------------------------------
// logger
// ===================================================================
import * as logger_export from './logger';
// -------------------------------------------------------------------
// ui
// ===================================================================
import { ui } from './ui';
import * as baseUtils from './utils';
import * as animationutils from './utils/animationutils';
import * as colorutils from './utils/colorutils';
import * as deviceutils from './utils/deviceutils';
// -------------------------------------------------------------------
// utils
// ===================================================================
import * as domutils from './utils/domutils';
import * as geometryutils from './utils/geometryutils';
import * as geoutils from './utils/geoutils';
import * as mathutils from './utils/mathutils';
import * as urlutils from './utils/urlutils';
import * as xmlutils from './utils/xmlutils';

export { HttpClient } from './helper/httpclient';

export * from './helper/emitter';
export { EventEmitter } from './helper/emitter';

export { injector } from './helper/injector';

export { ui } from './ui';
export const utils = {
    ...baseUtils,
    dom: domutils,
    url: urlutils,
    color: colorutils,
    xml: xmlutils,
    geo: geoutils,
    device: deviceutils,
    geometry: geometryutils,
    animation: animationutils,
    math: mathutils,
    loadScript: (url: string): Promise<void> => {
        return scriptLoader.load(url);
    },
    loadFonts: (...names): Promise<any> => {
        return Promise.all(names.map(name => fontLoader.load(name)));
    }
};

export const datatype = {
    hierarchy: hierarchy,
    hierarchycollection: hierarchycollection,
    hierarchygrid: hierarchygrid,
};

// -------------------------------------------------------------------
// global export
// ===================================================================
if (!utils.globalContext['neurons']) {
    const globalExports = {
        HttpClient: helper_httpclient.HttpClient,
        ...helper_emitter,
        injector: helper_injector.injector,
        LoggerFactory: logger_export.LoggerFactory,
        ui: ui,
        utils: utils,
        datatype: datatype,
    }
    utils.globalContext['neurons'] = globalExports;
}