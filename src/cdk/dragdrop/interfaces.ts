
export enum DropPosition {
    'top' = 'top',
    'bottom' = 'bottom',
    'left' = 'left',
    'right' = 'right',
    'intersected' = 'intersected',
    'outside' = 'outside',
    'whatever' = 'whatever'
};

export interface IDragMeasure {
    originBox: {x: number, y: number, width: number, height: number};
    proxyBox: {x: number, y: number, width: number, height: number};
    mouseOffset: {x: number, y: number};
}

export interface IDropMeasure {
    dirty: boolean;
    box: {x: number, y: number, width: number, height: number};
}

export interface IDropTouching {
    position: DropPosition;
    element: HTMLElement;
    whatevers: HTMLElement[];
}

export interface IDragConfig {
    beginOffset: number;
}

export type DragValidator = (dragSource: IDragSource, manager: IDragManager) => boolean;
export type DraggingLifeHook = (dragSource: IDragSource, manager: IDragManager) => void;
export type DropValidator = (position: DropPosition, dragSource: IDragSource, manager: IDragManager) => boolean;
export type DroppingLifeHook = (position: DropPosition, dragSource: IDragSource, manager: IDragManager) => void;
export type DropFeedbackHook = (feedbackData: any, dragSource: IDragSource, manager: IDragManager) => void;
export type DropDetecting = {
    [position: string]: {x?: number | string, y?: number | string, width?: number | string, height?: number | string}
}

export interface IDraggableOption {
    scope?: Function | string;
    data?: Function | ((dragDom: HTMLElement) => any) | any;
    direction?: 'x' | 'y' | 'xy';
    proxyClass?: string;
    proxyElement?: Function | HTMLElement;
    // validator
    canDrag?: DragValidator;
    // life hooks
    onDragStart?: DraggingLifeHook;
    onDragging?: DraggingLifeHook;
    onDragStop?: DraggingLifeHook;
    
    onDropped?: DropFeedbackHook;
    onAccepted?: DropFeedbackHook;
    onRevert?: DropFeedbackHook;
}

export interface IDroppableOption {
    scope?: string;
    dropTarget?: string;
    dropMode?: 'accept' | 'drop' | 'revert';
    placeholderClass?: string;
    detecting?: DropDetecting,
    canDrop?: DropValidator;

    onDragEnter?: DroppingLifeHook;
    onDragMove?: DroppingLifeHook;
    onDragLeave?: DroppingLifeHook;
    onDrop?: DroppingLifeHook;
}

export interface IDragSource {
    discarded: boolean;
    data: any;
    scope: string;
    element: HTMLElement;
    dragOption: IDraggableOption;
    startEvent: MouseEvent;
    moveEvent?: MouseEvent;
    dropEvent?: MouseEvent;

    proxyElement?: HTMLElement;
    placeholderElement?: HTMLElement;
    measure?: IDragMeasure;
    touching?: IDropTouching;
    
    dropMode?: 'accept' | 'drop' | 'revert';
    // feedback
    feedback: {
        accept: (dragData?: any) => void;
        drop: (dragData?: any) => void;
        revert: (dragData?: any) => void;
    }
    // validator
    canDrag?: DragValidator;
    // life hooks
    onDragStart?: DraggingLifeHook;
    onDragging?: DraggingLifeHook;
    onDragStop?: DraggingLifeHook;
}

export interface IDragManager {
    config(opt: IDragConfig);
    clearDrag(dom: HTMLElement): void;
    clearDrop(dom: HTMLElement): void;
    draggable(dom: HTMLElement, option?: IDraggableOption): void;
    droppable(dom: HTMLElement, option?: IDroppableOption): void;
    stopDrag();
    startDrag(dom: HTMLElement, startEvent: MouseEvent, scope?: string, data?: any);
}

export function noop() {};