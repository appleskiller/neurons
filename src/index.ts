
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
export { Animation,
    dragManager,
    popupManager,
    scrollManager,

    POPUP_TOKENS,
    DropPosition,
    bindTheme
} from './cdk';
// -------------------------------------------------------------------
// components
// ===================================================================
export {
    Button,
    CheckItem,
    HorizontalCheckGroup,
    CheckBox,
    CheckBoxGroup,
    DropDownButton,
    DropDownList,
    DropDownTrigger,
    SvgIcon,
    Input,
    NumberInput,
    SearchInput,
    TextArea,
    CollapsibleList,
    List,
    SearchableList,
    SortableList,
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

    icons,
    shapes,
    theme
} from './components';
