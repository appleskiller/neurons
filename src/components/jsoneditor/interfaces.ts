
import { IEmitter } from "neurons-emitter";

export interface IPropertySchema {
    type: string;
    title?: string;
    description?: string;
    order?: number;
    default?: any;
    enum?: any[];
    enumsAlias?: {[enumValue: string]: string};
    enumsOrder?: any[];
    min?: number;
    max?: number;
    renderer?: string;
    rendererOption?: {
        [key: string]: any;
    },
    required?: boolean;
    readonly?: boolean;
    hidden?: boolean;

    properties?: IPropertiesSchema;

    // -- array type only ---------
    sortableItems?: boolean;
    
    items?: IPropertySchema;
    // ============================
}

export interface IPropertiesSchema {
    [property: string]: IPropertySchema;
}

export interface IJSONSchema {
    properties?: IPropertiesSchema;
    items?: IPropertySchema;
}

export interface IJSEDataChanges {
    type: 'add' | 'delete' | 'change' | 'refresh';
    pointer: string;
    oldValue: any;
    newValue: any;
}

export interface IJSEFormControl {
    readonly onDataRefresh: IEmitter<IJSEDataChanges>;
    readonly onDataChange: IEmitter<IJSEDataChanges>;
    readonly object: any;

    refresh(pointer?: string): void;
    reset(object: any): void;
    notify(pointer?: string): void;

    getValue(pointer: string): any;
    setValue(pointer: string, value: any, silent?: boolean): void;
    // for array items
    addValue(pointer: string, value: any, silent?: boolean): void;
    // delete property
    deleteValue(pointer: string, silent?: boolean): void;

    destroy(): void;
}

export interface IJSENode {
    schema: IPropertySchema;
    property: string;
    index: number;
    depth: number;

    pointer: string;
    schemaPointer: string;

    children?: IJSENode[];
    parent?: IJSENode | IJSERoot;
    root?: IJSERoot;
}

export interface IJSERoot {
    schema: IJSONSchema;
    children: IJSENode[];
}

export interface IJSEDataControl {
    refresh(pointer?: string);

    onRefresh: IEmitter<string>;
}

export const noop = {};
