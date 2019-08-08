import { isDefined } from './typeutils';

function isObject(x: any): boolean {
    return typeof x === 'object' && x !== null;
}
function isClass(obj: any): boolean {
    return typeof obj === 'function';
}
function isMethodDesc(desc: any): boolean {
    return !!desc && typeof desc.get !== 'function' && typeof desc.set !== 'function';
}
export enum decoratorType {
    CLASS,
    PROPERTY,
    METHOD,
    STATIC_PROPERTY,
    STATIC_METHOD
}
export type AccessorDesc = { get?: Function, set?: Function, [key: string]: any };
export type MethodDesc = { value?: Function, [key: string]: any };
export type ClassDecoratorFunction = (type: decoratorType, target: Function) => void;
export type PropertyDecoratorFunction = (type: decoratorType, target: Function, targetKey: string, desc?: AccessorDesc) => void;
export type MethodDecoratorFunction = (type: decoratorType, target: Function, targetKey: string, desc: MethodDesc) => void;
export type DecoratorFunction = ClassDecoratorFunction | PropertyDecoratorFunction | MethodDecoratorFunction;

export function decorator(fn: DecoratorFunction): Function {
    function internalDecorator(target: any, targetKey?: string, desc?: any): void {
        if (isClass(target)) {
            if (!targetKey) {
                (fn as ClassDecoratorFunction)(decoratorType.CLASS, target);
            } else {
                // 如果desc === undefined则认为是一个静态成员属性，否则为成员方法
                if (isMethodDesc(desc)) {
                    (fn as MethodDecoratorFunction)(decoratorType.STATIC_METHOD, target, targetKey, desc);
                } else {
                    (fn as PropertyDecoratorFunction)(decoratorType.STATIC_PROPERTY, target, targetKey, desc);
                }
            }
        } else if (isDefined(targetKey) && isObject(target)) {
            if (isMethodDesc(desc)) {
                (fn as MethodDecoratorFunction)(decoratorType.METHOD, target, targetKey, desc);
            } else {
                (fn as PropertyDecoratorFunction)(decoratorType.PROPERTY, target, targetKey, desc);
            }
        } else {
            throw new TypeError();
        }
    }
    return internalDecorator;
}
