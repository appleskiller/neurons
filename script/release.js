var semver = require('semver');
var path = require('path');
var fs = require('fs-extra');
var util = require('./util');

var args = util.parseArgs();
var registry = args.registry === 'taobao' ? 'https://registry.npm.taobao.org' : 'https://registry.npmjs.org';
var registryArgs = args.registry === 'taobao' ? '-- --registry taobao' : '';

util.required('git');

// update internal deps
util.exec(`npm run update-deps ${registryArgs}`);
// test
util.exec('npm run test-once');

var package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
// verify version
var latestVersion = util.exec(`npm --registry ${registry} view ${package.name} version`).trim();
if (semver.lte(package.version, latestVersion)) {
    package.version = [semver.major(latestVersion), semver.minor(latestVersion), semver.patch(latestVersion) + 1].join('.');
    fs.outputJsonSync(path.resolve(__dirname, '../package.json') , package, { spaces: '  ' })
}

// build
util.exec('npm run build');
// verify git status
var statusOut = util.exec('git status -s');
if (!!statusOut.stdout) {
    util.exec('git add .');
    util.exec('git commit -m "build: auto commit before release"');
}
// tag
util.exec('git tag -f -a v' + package.version + ' -m "build: auto tag before release v' + package.version + '"');
util.exec('git push');
util.exec('git push --tags -f');
// publish
util.cd('./dist/');
util.exec('npm publish --access=public --registry https://registry.npmjs.org');