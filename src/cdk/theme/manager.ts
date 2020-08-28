import { appendCSSTagOnce } from 'neurons-dom';
import { globalCache, isEmpty, merge } from 'neurons-utils';
import { bindTheme } from './index';

const nestingStyleRegExp = /\{[^\}]{0,}\{/;

export interface IThemeManager {
    setVariables(variables: any): void;
}

export const internalThemeManager = globalCache('ne_theme_variables', {
    styles: [],
    variables: {},
    refs: [],
    _inited: false,
    _registedStyles: {},
    init: function(variables) {
        // 仅调用一次，其参数将作为基本的样式变量
        if (!internalThemeManager._inited) {
            internalThemeManager._inited = true;
            variables = merge(variables || {});
            internalThemeManager.variables = merge(true, variables, internalThemeManager.variables);
            internalThemeManager.styles.forEach(styleInfo => {
                // 检查是否存在绑定，以及嵌套风格写法
                if (nestingStyleRegExp.test(styleInfo.css) || styleInfo.css.indexOf('$') !== -1) {
                    internalThemeManager.refs.push(bindTheme(styleInfo.css, internalThemeManager.variables));
                } else {
                    appendCSSTagOnce(styleInfo.id, styleInfo.css);
                }
            });
        }
    },
    setVariables: function (variables) {
        if (!variables || isEmpty(variables)) return;
        merge(true, internalThemeManager.variables, variables);
        if (!internalThemeManager._inited) return;
        internalThemeManager.refs.forEach(ref => ref.detectChanges());
    },
    addStyles: function (id, css) {
        if (!id || !css) return;
        if (internalThemeManager._registedStyles[id]) return;
        internalThemeManager._registedStyles[id] = true;
        if (!internalThemeManager._inited) {
            internalThemeManager.styles.push({
                id: id,
                css: css
            });
        } else {
            // 检查是否存在绑定，以及嵌套风格写法
            if (nestingStyleRegExp.test(css) || css.indexOf('$') !== -1) {
                internalThemeManager.refs.push(bindTheme(css, internalThemeManager.variables));
            } else {
                appendCSSTagOnce(id, css);
            }
        }
    }
});

export class ThemeManager implements IThemeManager {
    setVariables(variables) {
        internalThemeManager.setVariables(variables);
    }
}

