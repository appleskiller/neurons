// 用于解决在特殊的混合使用静态编译和动态加载情况，保持库导出的内容的唯一性
const __g = (typeof window !== 'undefined') ? window : (this || {});
import * as moduleExports from './index';
export default {
    ...(__g['neurons'] || moduleExports)
};