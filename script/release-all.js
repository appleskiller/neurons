
const util = require('./util');

util.cd('../neurons-xml');
util.exec('npm run release');

util.cd('../neurons-injector');
util.exec('npm run release');

util.cd('../neurons-utils');
util.exec('npm run release');

util.cd('../neurons-animation');
util.exec('npm run release');

util.cd('../neurons-sort');
util.exec('npm run release');

util.cd('../neurons-emitter');
util.exec('npm run release');

util.cd('../neurons-dom');
util.exec('npm run release');

util.cd('../neurons');
util.exec('npm run release');