// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const webpack = require('webpack');
const path = require('path');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        plugins: [
            require('karma-webpack'),
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage-istanbul-reporter')
        ],
        files: [
            'test/index.js',
            {pattern: 'test/assets/**/*.*', watched: true, included: false, served: true, nocache: true}
        ],
        preprocessors: {
            'test/index.js': ["webpack"]
        },
        webpack: {
            mode: 'development',
            devtool: 'inline-source-map',
            resolve: {
                // Add `.ts` and `.tsx` as a resolvable extension.
                extensions: [".ts", ".tsx", ".js"]
            },
            module: {
                rules: [{
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'awesome-typescript-loader'
                }]
            },
            plugins: [
                new HotModuleReplacementPlugin()
            ],
        },
        client: {
            clearContext: false
        },
        coverageIstanbulReporter: {
            dir: require('path').join(__dirname, 'coverage'), reports: ['html', 'lcovonly'],
            fixWebpackSourcePaths: true
        },
        reporters: ['progress', 'kjhtml'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false
    });
};
