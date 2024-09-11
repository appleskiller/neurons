var semver = require('semver');
var path = require('path');
var fs = require('fs-extra');
var util = require('./util');

var args = util.parseArgs();
var registry = args.registry === 'taobao' ? 'https://registry.npmmirror.com' : 'https://registry.npmjs.org';

util.required('git');

var package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
// verify version
var latestVersion = util.exec(`npm --registry ${registry} view ${package.name} version`).trim();
if (semver.lte(package.version, latestVersion)) {
    package.version = [semver.major(latestVersion), semver.minor(latestVersion), semver.patch(latestVersion) + 1].join('.');
} else {
    package.version = [semver.major(package.version), semver.minor(package.version), semver.patch(package.version) + 1].join('.');
}
fs.outputJsonSync(path.resolve(__dirname, '../package.json') , package, { spaces: '  ' });

// verify git status
var statusOut = util.exec('git status -s');
if (!!statusOut.stdout) {
    util.exec('git add .');
    util.exec('git commit -m "build: auto commit before tag"');
}
// tag
util.exec('git tag -f -a v' + package.version + ' -m "build: auto tag v' + package.version + '"');
util.exec('git push');
util.exec('git push --tags -f');
