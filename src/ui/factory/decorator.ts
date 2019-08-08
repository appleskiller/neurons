import { decorator, decoratorType, uniqueId } from '../../utils';
import { bindingFactory } from './factory';
import { IUIBindingDefinition } from '../compiler/common/interfaces';
import { appendCSSTagOnce } from '../../utils/domutils';

export function Inject(token: any) {
    if (!token) throw new Error(`Invalid parameter for decorator`);
    return decorator((type, target, targetKey, desc) => {
        if (type === decoratorType.PROPERTY) {
            target.injectRequired = Object.assign({}, target.injectRequired);
            target.injectRequired[targetKey] = token;
        } else {
            throw new TypeError(`This decorator is only acted upon property`);
        }
    });
}

export function Emitter(eventName?: string) {
    return decorator((type, target, targetKey, desc) => {
        if (type === decoratorType.PROPERTY || type === decoratorType.METHOD) {
            target.emitterRequired = Object.assign({}, target.emitterRequired);
            target.emitterRequired[targetKey] = eventName || targetKey;
        } else {
            throw new TypeError(`Decorator "Emitter" is only acted upon property or method`);
        }
    });
}

/**
 * UI状态绑定装饰器。
 * @param definition UI状态绑定完整描述
 */
export function UIBinding(definition: IUIBindingDefinition) {
    return decorator((type, target) => {
        if (type === decoratorType.CLASS) {
            bindingFactory.register(definition.selector, definition, target);
            // 插入组件样式
            if (definition && definition.style) {
                const id = uniqueId('ne_ui_style');
                appendCSSTagOnce(id, definition.style);
            }
        } else {
            throw new TypeError(`Decorator "UIBinding" must be only acted upon Class`);
        }
    });
}
/**
 * 声明绑定属性。
 * @param alias 属性别名
 */
export function Property(alias?: string) {
    return decorator((type, target, targetKey, desc) => {
        if (type === decoratorType.PROPERTY) {
            target.propertyRequired = Object.assign({}, target.propertyRequired);
            alias = alias || targetKey;
            // propery name : alias
            target.propertyRequired[targetKey] = alias;
        } else {
            throw new TypeError(`Decorator "Property" must be only acted upon property`);
        }
    });
}

export function Style(css: string) {
    return decorator((type, target) => {
        if (type === decoratorType.CLASS) {
            if (css) {
                const id = uniqueId('ne_style');
                appendCSSTagOnce(id, css);
            }
        } else {
            throw new TypeError(`Decorator "Style" must be only acted upon Class`);
        }
    });
}

export function Element(id: string) {
    return decorator((type, target, targetKey, desc) => {
        if (type === decoratorType.PROPERTY) {
            target.templateElementRequired = Object.assign({}, target.templateElementRequired);
            target.templateElementRequired[targetKey] = id;
        } else {
            throw new TypeError(`Decorator "Element" must be only acted upon property`);
        }
    });
}