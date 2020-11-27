
var path = require('path');
var fs = require('fs-extra');
var util = require('./util');
var semver = require('semver');

var args = util.parseArgs();
var registry = args.registry === 'taobao' ? 'https://registry.npm.taobao.org' : 'https://registry.npmjs.org';

var package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
// verify and update version
function isInternalDep(packageName) {
    return (packageName && /^neurons-/.test(packageName));
}
function getPackageJson(moduleName) {
    var packPath = path.resolve(__dirname, `../node_modules/${moduleName}/package.json`);
    if (fs.existsSync(packPath)) {
        return fs.readJsonSync(packPath);
    } else {
        return null;
    }
}

var deps = {};

function updateToLatestVersion(packageName, dependencies, depType) {
    if (isInternalDep(packageName)) {
        var modulePackage = getPackageJson(packageName);
        var oldVersion = modulePackage ? modulePackage.version : null;
        var latestVersion = util.exec(`npm --registry ${registry} view ${packageName} version`).trim();
        console.log(`${packageName} ${oldVersion || dependencies[packageName]} => ${latestVersion}`)
        dependencies[packageName] = latestVersion;
        if (!oldVersion || semver.lt(oldVersion, latestVersion)) {
            if (!deps[depType]) {
                deps[depType] = [];
            }
            deps[depType].push(`${packageName}@${latestVersion}`);
        }
    }
}

if (package.dependencies) {
    for (const key in package.dependencies) {
        updateToLatestVersion(key, package.dependencies, 'prod');
    }
}
if (package.devDependencies) {
    for (const key in package.devDependencies) {
        updateToLatestVersion(key, package.devDependencies, 'dev');
    }
}
if (package.peerDependencies) {
    for (const key in package.peerDependencies) {
        updateToLatestVersion(key, package.peerDependencies, 'optional');
    }
}
fs.outputJsonSync(path.resolve(__dirname, '../package.json'), package, { spaces: '  ' });
Object.keys(deps).forEach(depType => {
    util.exec(`npm --registry ${registry} install --save-${depType} ${deps[depType].join(' ')}`);
})
