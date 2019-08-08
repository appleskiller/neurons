
import { Injector } from '../helper/injector';
import { bind, bootstrap } from './factory/binding';
import { Element, Property, UIBinding, Inject, Emitter } from './factory/decorator';
import { bindingInjector, BINDING_TOKENS } from './factory/injector';

import { PopupPosition, PopupAnimation, PopupMode, IPopupManagerConfig, TOKENS } from './cdk/popup/interfaces';
import { PopupManager, popupManager } from './cdk/popup/manager';
import { DropPosition } from './cdk/dragdrop/interfaces';
import { DragManager, dragManager } from './cdk/dragdrop/manager';
import { Button } from './components/button/button';
import { CheckBox } from './components/checkbox/checkbox';
import { CheckBoxGroup, CheckBoxGroupItem } from './components/checkbox/checkboxgroup';
import { DropDownButton, DropDownList } from './components/dropdown/dropdown';
import { SvgIcon } from './components/icon/svgicon';
import { NumberInput } from './components/input/number';
import { Input } from './components/input/input';
import { SearchInput } from './components/input/search';
import { List } from './components/list/list';
import { RadioButton } from './components/radio/radiobutton';
import { RadioGroup } from './components/radio/radiogroup';
import { CollapsibleList } from './components/list/collapsiblelist';
import { SortableList } from './components/list/sortablelist';
import { CheckItem } from './components/check/check';
import { checkbox_uncheck, checkbox_check, radio_uncheck, radio_check, caret_down, search, times, check, empty_icon, ellipsis_h } from './components/icon/icons';
import { ISVGIcon } from '../utils/domutils';

export const ui = {
    bind: bind,
    bootstrap: bootstrap,
    injector: bindingInjector,

    UIBinding: UIBinding,
    Property: Property,
    Emitter: Emitter,
    Element: Element,
    Inject: Inject,

    TOKENS: BINDING_TOKENS,

    popup: {
        TOKENS: TOKENS,
        manager: popupManager,
        
        PopupPosition: PopupPosition,
        PopupAnimation: PopupAnimation,
        PopupMode: PopupMode,

        PopupManager: PopupManager,
        createManager: (config: IPopupManagerConfig) => {
            const manager = new PopupManager();
            manager.config(config);
            return manager;
        }
    },
    dragdrop: {
        manager: dragManager,
    
        DropPosition: DropPosition,
        DragManager: DragManager
    },

    button: {
        Button: Button
    },
    checkbox: {
        CheckBox: CheckBox,
        CheckBoxGroup: CheckBoxGroup
    },
    check: {
        CheckItem: CheckItem,
    },
    dropdown: {
        DropDownButton: DropDownButton,
        DropDownList: DropDownList,
    },
    icon: {
        SvgIcon: SvgIcon,
        icons: {
            checkbox_uncheck: checkbox_uncheck,
            checkbox_check: checkbox_check,
            radio_uncheck: radio_uncheck,
            radio_check: radio_check,
            caret_down: caret_down,
            search: search,
            times: times,
            check: check,
            empty_icon: empty_icon,
            ellipsis_h: ellipsis_h,
        }
    },
    input: {
        NumberInput: NumberInput,
        Input: Input,
        SearchInput: SearchInput,
    },
    list: {
        List: List,
        CollapsibleList: CollapsibleList,
        SortableList: SortableList,
    },
    radio: {
        RadioButton: RadioButton,
        RadioGroup: RadioGroup,
    },
}