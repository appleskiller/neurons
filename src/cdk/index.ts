import { IThemeManager, ThemeManager } from './theme/manager';
import { LoadingService } from './loading';
import { ILoadingService } from './loading/loading';

export * from './loading';
export { Animation } from "./animation";
export { dragManager } from './dragdrop/manager';
export { popupManager } from './popup/manager';
export { scrollManager } from './scroll/manager';

export { TOKENS as POPUP_TOKENS } from './popup/interfaces';
export { DropPosition } from './dragdrop/interfaces';

export { ThemeManager } from './theme/manager';
export { bindTheme } from './theme';

export { StringBindingRef, compileStringTemplate, renderStringTemplate, bindStringTemplate } from './stringtemplate';
export { renderTemplate } from './htmltemplate';

export const themeManager: IThemeManager = new ThemeManager();
export const loading: ILoadingService = new LoadingService();