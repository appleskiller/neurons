
var path = require('path');
var fs = require('fs-extra');
var util = require('./util');

var package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
// verify and update version
function isInternalDep(packageName) {
    return (packageName && /^neurons-/.test(packageName));
}

var deps = {};

function updateToLatestVersion(packageName, dependencies, depType) {
    if (isInternalDep(packageName)) {
        var latestVersion = util.exec(`npm --registry https://registry.npmjs.org view ${packageName} version`).trim();
        console.log(`${packageName} ${dependencies[packageName]} => ${latestVersion}`)
        dependencies[packageName] = latestVersion;
        if (!deps[depType]) {
            deps[depType] = [];
        }
        deps[depType].push(`${packageName}@${latestVersion}`);
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
    util.exec(`npm --registry https://registry.npmjs.org install --save-${depType} ${deps[depType].join(' ')}`);
})
