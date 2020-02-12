
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

export function noop() {};