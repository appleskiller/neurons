const util = require('./util');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const imports = ['./demos'];

const files = glob.sync(`./demo/src/demos/*.ts`);
for (let i = 0; i < files.length; i++) {
    imports.push(`./demos/${path.basename(files[i], '.ts')}`);
}
var content = `
// 使用直接引入的方式进行快速开发
${imports.map(p => `import '${p}'`).join(';\n')};
import './app';
`;
fs.writeFileSync(path.resolve(__dirname, '../demo/src/index.ts'), content, 'utf-8');
util.exec('webpack-dev-server --progress');