
export interface IItemState<T> {
    item: T;
    itemIndex: number;
    selected: boolean;
    label: string;
    params?: any;
}

export interface IItemStateStatic<T> {
    new (): IItemState<T>
}

export interface ISelectionChangeEvent<T> {
    selectedItem: T;
    dataProvider: T[];

    oldSelectedItem: T;
}

export interface IMultiSelectionChangeEvent<T> {
    selectedItems: T[];
    dataProvider: T[];

    oldSelectedItems: T[];
}

export interface IItemClickEvent<T> {
    item: T;
    index: number;
    dataProvider: T[];
    element: HTMLElement;
    causeEvent: MouseEvent;
}

export interface ISVGShape {
    prefix: string;
    shapeName: string;
    // [width height ligatures unicode path]
    shape: [number, number, string[], string, string];

    type?: 'dataURI' | 'path';
    fill?: string;
    fillRule?: 'nonzero' | 'evenodd';
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs';
    strokeDasharray?: string;
    strokeDashoffset?: number;

    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    sizing?: 'contain' | 'cover' | 'scale';
    width?: number;
    height?: number;

    [key: string]: any;
}

export function noop() {};