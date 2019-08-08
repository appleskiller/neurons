import { List, DefaultItemState } from './list';
import { UIBinding, Property, Element, Emitter } from '../../factory/decorator';
import { dragManager } from '../../cdk/dragdrop/manager';
import { IElementRef } from '../../compiler/common/interfaces';
import { bind } from '../../factory/binding';
import { IDragSource, DropPosition, DragValidator, DropValidator, DropDetecting, DroppingLifeHook } from '../../cdk/dragdrop/interfaces';
import { moveItemTo, moveIndexTo } from '../../../utils';
import { IEmitter } from '../../../helper/emitter';

@UIBinding({
    selector: 'ne-sortable-list-item',
    template: `
        <div #conainer class="ne-sortable-list-item"></div>
    `,
})
export class SortableListItemWrapper {
    @Property() item: any;
    @Property() itemRenderer: any = DefaultItemState;
    @Property() itemRendererBinding: any;
    @Property() params: any;
    @Property() index: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
    @Property() functions: any;

    @Element('conainer') conainer: HTMLElement;

    private _ref: IElementRef<any>;

    onChanges(changes) {
        let reseted = false;
        if (!changes || 'itemRenderer' in changes || 'itemRendererBinding' in changes) {
            this._ref && this._ref.destroy();
            this._ref = bind(this.itemRenderer, {
                container: this.conainer,
                hostBinding: this.itemRendererBinding,
                state: this._getState()
            });
            reseted = true;
        }
        if (!reseted && (!changes || 'item' in changes || 'index' in changes || 'selected' in changes || 'label' in changes || 'params' in changes)) {
            this._ref && this._ref.setState(this._getState());
        }
        if (changes && ('item' in changes || 'index' in changes || 'functions' in changes)) {
            dragManager.clearDrag(this.conainer);
            dragManager.clearDrop(this.conainer);
            dragManager.draggable(this.conainer, {
                scope: 'ne-sortable-item',
                data: {
                    item: this.item,
                    itemIndex: this.index,
                },
                canDrag: this.functions && this.functions.canDrag ? this.functions.canDrag : () => true,
                direction: this.functions && this.functions.direction ? this.functions.direction() : 'y',
            })
            dragManager.droppable(this.conainer, {
                canDrop: this.functions && this.functions.canDrop ? this.functions.canDrop : () => true,
                detecting: this.functions && this.functions.detecting ? this.functions.detecting() : {
                    [DropPosition.top]: {y: '50%', height: '-50%'},
                    [DropPosition.bottom]: {y: '-50%', height: '50%'},
                },
                onDrop: (position: DropPosition, dragSource: IDragSource) => {
                    this.functions.onDrop && this.functions.onDrop(this.item, this.index, position, dragSource);
                }
            })
        }
    }
    onDestroy() {
        this._ref && this._ref.destroy();
        dragManager.clearDrag(this.conainer);
        dragManager.clearDrop(this.conainer);
    }
    private _getState() {
        return this.functions && this.functions.itemRendererState
            ? this.functions.itemRendererState(this.item, this.index)
            : {
                item: this.item,
                itemIndex: this.index,
                selected: this.selected,
                label: this.label,
                params: this.params
            }
    }
}

@UIBinding({
    selector: 'ne-sortable-list',
    template: `
        <div #container [class]="{'ne-sortable-list': true, 'ne-list': true, 'enable-selection': enableSelection}" (scroll)="onScroll($event)">
            <div #shim class="ne-list-shim" [style.height]="contentHeight">
                <div #content class="ne-list-content" [style.top]="offset">
                    <ne-sortable-list-item 
                        *for="item in nativeDataProvider" let-index="$index"
                        [class.ne-list-item]="true"
                        [class.selected]="isItemSelected(item, startIndex + index)"
                        (click)="onItemClick($event, item, startIndex + index)"
                        (mousedown)="onItemMousedown($event, item, startIndex + index)"
                        [item]="item"
                        [index]="startIndex + index"
                        [selected]="isItemSelected(item, startIndex + index)"
                        [label]="getItemLabel(item)"
                        [params]="getItemParams(item, startIndex + index)"
                        [itemRenderer]="itemRenderer"
                        [itemRendererBinding]="itemRendererBinding"
                        [functions]="{
                            'itemRendererState': null,
                            'canDrag': canDrag,
                            'canDrop': canDrop,
                            'onDrop': onDrop,
                            'direction': direction,
                            'detecting': detecting
                        }"
                    ></ne-sortable-list-item>
                </div>
            </div>
            <div [class]="{'empty-info': true, 'show': !dataProvider || !dataProvider.length}">无内容</div>
        </div>
    `,
    style: `
        .ne-sortable-list.enable-selection .ne-list-item {
            user-select: none;
        }
        .draggable-wrapper[drag-scope=ne-sortable-item] {
            pointer-events: none;
        }
    `
})
export class SortableList<T> extends List<T> {
    @Property() canDrag: DragValidator;
    @Property() canDrop: DropValidator;
    @Property() detecting: () => DropDetecting;
    @Property() direction: () => 'x' | 'y' | 'xy';
    @Property() onDrop?: (targetItem, targetIndex, position: DropPosition, dragSource: IDragSource) => void = (targetItem, targetIndex, position: DropPosition, dragSource: IDragSource) => {
        if (dragSource.data.itemIndex === targetIndex) {
            return
        }
        // TODO 因为目前更新后会merge item，因此无法维持item引用，使用this.dataProvider.indexOf(dragSource.data)几乎会永远为-1
        // const isMoved = this.dataProvider.indexOf(dragSource.data) !== -1;
        if (position === 'top') {
            moveIndexTo(this.dataProvider, dragSource.data.itemIndex, targetIndex)
            // isMoved ? moveItemTo(this.dataProvider, dragSource.data, targetIndex) : this.dataProvider.splice(targetIndex, 0, dragSource.data);
        } else if (position === 'bottom') {
            moveIndexTo(this.dataProvider, dragSource.data.itemIndex, targetIndex + 1)
            // isMoved ? moveItemTo(this.dataProvider, dragSource.data, targetIndex + 1) : this.dataProvider.splice(targetIndex + 1, 0, dragSource.data);
        }
        this._resetDataProvider();
        this.sortChanged.emit(this.dataProvider);
        this.cdr.detectChanges();
    }
    @Emitter() sortChanged: IEmitter<T[]>;

}