import { DragScrollControler } from './dragscroll';
import { IDragScrollOption } from './interfaces';


export class ScrollManager {
    private _dragScroll: DragScrollControler = new DragScrollControler();
    enableDragScroll(container: HTMLElement, option: IDragScrollOption) {
        this._dragScroll.enableDragScroll(container, option);
    }
    disableDragScroll(container: HTMLElement) {
        this._dragScroll.disableDragScroll(container);
    }
    refreshDragScroll(container: HTMLElement) {
        this._dragScroll.refreshDragScroll(container);
    }
}

export const scrollManager = new ScrollManager();