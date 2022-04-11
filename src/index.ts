
// import './polyfill';

export { LoggerFactory } from './logger';
export { HttpClient } from './helper/httpclient';
export { parseXML, XMLASTNodeType } from './helper/xml';
// -------------------------------------------------------------------
// datatype
// ===================================================================
import * as datatypeExports from './datatype';
import { IStatementInfo, parseStatement } from './binding/compiler/parser/statement';
import { composeVaribles, composeGetter, composeCallback } from './binding/common/util';
import { INeBindingFunction } from './binding/common/interfaces';
import { ILoadingService } from './cdk/loading/loading';
export const datatype = datatypeExports;

// -------------------------------------------------------------------
// compiler
// ===================================================================
export const compilerUtil = {
    parseStatement: function (statement: string): IStatementInfo {
        return parseStatement(statement);
    },
    composeGetter: function (info: IStatementInfo, key?: string, skipError?: boolean): INeBindingFunction {
        return composeGetter(key || '', info, skipError);
    },
    composeCallback: function(info: IStatementInfo, key?: string, skipError?: boolean): INeBindingFunction {
        return composeCallback(key || '', info, skipError);
    }
}
// -------------------------------------------------------------------
// binding
// ===================================================================
export {
    Element,
    Property,
    Binding,
    Inject,
    Emitter,
    Style,

    BINDING_TOKENS,

    bind,
    bootstrap,
    parseTemplate,
} from './binding';
export { HTMLASTNodeType } from './binding/compiler/parser/template';
// -------------------------------------------------------------------
// cdk
// ===================================================================
export {
    Animation,
    ThemeManager,
    LoadingService,
    LoadingMask,

    dragManager,
    popupManager,
    scrollManager,
    themeManager,
    loading,

    POPUP_TOKENS,
    DropPosition,
    bindTheme,

    StringBindingRef,
    compileStringTemplate,
    renderStringTemplate,
    bindStringTemplate,
    renderTemplate,
} from './cdk';
// -------------------------------------------------------------------
// components
// ===================================================================
export {
    Button,
    SwitchButton,
    CheckItem,
    HorizontalCheckGroup,
    CheckBox,
    CheckBoxGroup,
    PalletePicker,
    ColorWheel,
    HSlider,
    DropDownButton,
    DropDownList,
    DropDownTrigger,
    SvgIcon,
    Input,
    NumberInput,
    DigitNumberInput,
    SearchInput,
    RenameInput,
    TextArea,
    CollapsibleList,
    List,
    TileList,
    InfiniteTileList,
    SearchableList,
    SortableList,
    Tree,
    SearchableTree,
    RadioButton,
    RadioGroup,
    ToolTip,
    Hint,
    FileUploader,
    ImageUploader,
    FileUploadTrigger,
    SvgImage,
    SvgShape,
    SVGPathShape,
    SVGDataURIShape,

    alert,
    modal,
    sidePanel,
    tooltip,
    stepperModal,
    stepperAccordion,
    STEPPER_TOKENS,

    icons,
    shapes,
    theme
} from './components';
