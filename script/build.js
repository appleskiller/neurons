
var fs = require('fs-extra');
var path = require('path');
var util = require('./util');

var rollup = require('rollup');
var resolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var builtinsPlugin = require('rollup-plugin-node-builtins');
var globalsPlugin = require('rollup-plugin-node-globals');
var json = require('rollup-plugin-json');
var uglify = require('rollup-plugin-uglify').uglify;
var package = require('../package.json');

// auto name out file
const name = (package.name.charAt(0) === '@') ? package.name.slice(1).replace('/', '-') : package.name.replace('/', '-');
// auto name amd id
const amdId = package.name;
// intro
const intro = `var __globalContext = (typeof window !== 'undefined') ? window : (typeof global !== 'undefined') ? global : {};
if (!__globalContext['${amdId}']) { __globalContext['${amdId}'] = exports; }`;
// input
const inputFile = 'src/index.ts';
const buildins = {
    'acorn': true,
    'htmlparser2': true,
}
// external module
const external = [];
// external globals module for browser
const globals = {}
// use package.dependencies and package.peerDependencies as default externals and golbal ids
if (package.dependencies) { for (const key in package.dependencies) { !buildins[key] && external.push(key); !globals[key] && (globals[key] = key); } }
if (package.peerDependencies) { for (const key in package.peerDependencies) { !buildins[key] && external.push(key); !globals[key] && (globals[key] = key); } }
// ------------------------------------------------
// clear dist
// ================================================

fs.removeSync(path.resolve(__dirname, '../dist'));
console.log(`Clear dist ...`);

// ------------------------------------------------
// method & variables
// ================================================
// input base name
const inputBaseName = path.basename(inputFile, '.ts');
const compliedInputFile = `dist/out-tsc/${inputBaseName}.js`;
async function build(input, output) {
    // create a bundle
    const bundle = await rollup.rollup(input);
    // generate code and a sourcemap
    await bundle.generate(output);
    // or write the bundle to disk
    await bundle.write(output);
}
const baseInputOption = {
    input: compliedInputFile,
    plugins: [
        // htmlparser2 需要导出一些内建包例如events、string_decoder等
        globalsPlugin(),
        builtinsPlugin(),
        resolve({
            browser: true
        }),
        commonjs(),
        json()
    ]
}

// ------------------------------------------------
// complie typescript
// ================================================

util.exec(`tsc -p tsconfig.json -d --declarationDir dist --outDir dist/out-tsc`);
package.typings = `${inputBaseName}.d.ts`;

async function buildAll() {

    // ------------------------------------------------
    // UMD Module -> package.main
    // ================================================
    // await build({
    //     ...baseInputOption,
    //     external: external
    // }, {
    //     name: amdId,
    //     file: `dist/umd/${name}.js`,
    //     format: 'umd',
    //     exports: 'named',
    //     globals: globals,
    //     intro: intro
    // });
    // console.log(`${inputFile} -> dist/umd/${name}.js ...`);
    // // update package
    // package.main = `umd/${name}.js`;

    // ------------------------------------------------
    // UMD Module uglify bundle -> package.main
    // ================================================
    await build({
        ...baseInputOption,
        plugins: [
            ...baseInputOption.plugins,
            uglify()
        ],
        external: external,
    }, {
        name: amdId,
        file: `dist/umd/${name}.min.js`,
        format: 'umd',
        exports: 'named',
        globals: globals,
        intro: intro
    });
    console.log(`${inputFile} -> dist/umd/${name}.min.js ...`);
    // update package
    package.main = `umd/${name}.min.js`;
    
    // ------------------------------------------------
    // ES Module -> package.module
    // ================================================
    
    // await build({
    //     ...baseInputOption,
    //     external: external
    // }, {
    //     file: `dist/esm5/${name}.js`,
    //     format: 'es',
    //     intro: intro
    // });
    // console.log(`${inputFile} -> dist/esm5/${name}.js ...`);
    // // update package
    // package.module = `esm5/${name}.js`;

    // ------------------------------------------------
    // Full bundle -> single bundle file for browser
    // as default behavior, collect external and globals from package.peerDependencies
    // ================================================
    const peerExternal = [];
    const peerGlobals = Object.assign({}, globals);
    if (package.peerDependencies) { for (const key in package.peerDependencies) { peerExternal.push(key); !peerGlobals[key] && (peerGlobals[key] = key); } }
    // normal bundle
    // await build({
    //     ...baseInputOption,
    //     external: peerExternal
    // }, {
    //     name: amdId,
    //     file: `dist/bundles/${name}.umd.js`,
    //     format: 'umd',
    //     exports: 'named',
    //     globals: peerGlobals,
    //     intro: intro
    // });
    // console.log(`${inputFile} -> dist/bundles/${name}.umd.js ...`);
    // uglify bundle
    // await build({
    //     ...baseInputOption,
    //     plugins: [
    //         ...baseInputOption.plugins,
    //         uglify()
    //     ],
    //     external: peerExternal
    // }, {
    //     name: amdId,
    //     file: `dist/bundles/${name}.umd.min.js`,
    //     format: 'umd',
    //     exports: 'named',
    //     globals: peerGlobals,
    //     intro: intro
    // });
    // console.log(`${inputFile} -> dist/bundles/${name}.umd.min.js ...`);

    // ------------------------------------------------
    // write package.json and copy files
    // ================================================
    
    fs.outputJsonSync(path.resolve(__dirname, '../dist/package.json') , package, { spaces: '  ' });
    if (fs.existsSync(path.resolve(__dirname, '../LICENSE'))) {
        fs.copySync(path.resolve(__dirname, '../LICENSE'), path.resolve(__dirname, '../dist/LICENSE'));
    }
    if (fs.existsSync(path.resolve(__dirname, '../README.md'))) {
        fs.copySync(path.resolve(__dirname, '../README.md'), path.resolve(__dirname, '../dist/README.md'));
    }
    console.log(`Copy package.json, LICENSE, README.md ...`);
    
    // ------------------------------------------------
    // clear build
    // ================================================
    fs.removeSync(path.resolve(__dirname, '../dist/out-tsc'));
    // ------------------------------------------------
    // done
    // ================================================
    console.log(`Done !`);
}

buildAll();
