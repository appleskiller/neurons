import { ClassLike } from 'neurons-injector';

const buildInElementClasses = {};
export enum BindingElementTypes {
    'ATTRIBUTE' = 'ATTRIBUTE',
    'CONTENT' = 'CONTENT',
    'DYNAMIC' = 'DYNAMIC',
    'ELEMENT' = 'ELEMENT',
    'FOR' = 'FOR',
    'IF' = 'IF',
}

export function registerBindingElement(type: BindingElementTypes, clazz: ClassLike) {
    buildInElementClasses[type] = clazz;
}

export function getBindingElementClass(type: BindingElementTypes) {
    return buildInElementClasses[type];
}