
const util = require('./util');

var args = util.parseArgs();
var registry = args.registry === 'taobao' ? 'https://registry.npm.taobao.org' : 'https://registry.npmjs.org';
var registryArgs = args.registry === 'taobao' ? '-- --registry taobao' : '';

// util.cd('../neurons-xml');
// util.exec(`npm run release ${registryArgs}`);
// util.cd('../neurons-injector');
// util.exec(`npm run release ${registryArgs}`);
// util.cd('../neurons-utils');
// util.exec(`npm run release ${registryArgs}`);


// util.cd('../neurons-animation');
// util.exec(`npm run release ${registryArgs}`);
// util.cd('../neurons-sort');
// util.exec(`npm run release ${registryArgs}`);
// util.cd('../neurons-emitter');
// util.exec(`npm run release ${registryArgs}`);
// util.cd('../neurons-dom');
// util.exec(`npm run release ${registryArgs}`);


util.cd('../neurons');
util.exec(`npm run release ${registryArgs}`);