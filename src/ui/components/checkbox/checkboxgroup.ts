import { UIBinding, Property, Emitter } from '../../factory/decorator';
import { isDate, isDefined, ObjectAccessor } from '../../../utils';
import { IEmitter } from '../../../helper/emitter';
import { IMultiSelectionChangeEvent, IItemState, IItemStateStatic } from '../interfaces';
import { List, defaultLabelFunction } from '../list/list';

@UIBinding({
    selector: 'ne-checkbox-group-item',
    template: `<ne-check-box class="ne-checkbox-group-item" [(checked)]="selected">{{label}}</ne-check-box>`,
    style: `
        .ne-checkbox-group-item.ne-check-box .ne-check-box-icon > .ne-icon {
            transition: none;
        }
    `
})
export class CheckBoxGroupItem<T> implements IItemState<T> {
    @Property() item: T = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
}

@UIBinding({
    selector: 'ne-checkbox-group',
    template: `
        <ne-list
            class="ne-checkbox-group"
            [active]="active"
            [itemRenderer]="itemRenderer"
            [dataProvider]="dataProvider"
            [(selectedItems)]="selectedItems"
            [labelField]="labelField"
            [labelFunction]="labelFunction"
            (multiSelectionChange)="multiSelectionChange.emit($event)"
            enableMultiSelection="true"
        ></ne-list>
    `,
    style: `
    `,
    requirements: [
        List
    ]
})
export class CheckBoxGroup<T> {
    @Property() dataProvider: T[] = [];
    @Property() selectedItems: T[] = [];
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() itemRenderer: IItemStateStatic<T> = CheckBoxGroupItem;
    @Property() active: boolean = true;

    @Emitter() selectedItemsChange: IEmitter<T>;
    @Emitter() multiSelectionChange: IEmitter<IMultiSelectionChangeEvent<T>>;
}