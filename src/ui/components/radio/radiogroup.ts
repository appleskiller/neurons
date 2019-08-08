import { UIBinding, Property, Emitter } from '../../factory/decorator';
import { RadioButton } from './radiobutton';
import { isDate, isDefined, ObjectAccessor } from '../../../utils';
import { StateChanges } from '../../compiler/common/interfaces';
import { IEmitter } from '../../../helper/emitter';
import { ISelectionChangeEvent, IItemStateStatic, IItemState } from '../interfaces';
import { List, defaultLabelFunction } from '../list/list';

@UIBinding({
    selector: 'ne-radio-group-item',
    template: `<ne-radio-button class="ne-radio-group-item" [(checked)]="selected">{{label}}</ne-radio-button>`,
    style: `
    `,
    requirements: [
        RadioButton
    ]
})
export class RadioGroupItem<T> implements IItemState<T> {
    @Property() item: T = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
}

@UIBinding({
    selector: 'ne-radio-group',
    template: `
        <ne-list
            class="ne-radio-group"
            [active]="active"
            [itemRenderer]="itemRenderer"
            [dataProvider]="dataProvider"
            [(selectedItem)]="selectedItem"
            [labelField]="labelField"
            [labelFunction]="labelFunction"
            (selectionChange)="selectionChange.emit($event)"
        ></ne-list>
    `,
    requirements: [
        RadioButton,
        List,
    ]
})
export class RadioGroup<T> {
    @Property() dataProvider: T[] = [];
    @Property() selectedItem: T;
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item: T) => defaultLabelFunction(item, this.labelField);
    @Property() itemRenderer: IItemStateStatic<T> = RadioGroupItem;
    @Property() active: boolean = true;

    @Emitter() selectedItemChange: IEmitter<T>;
    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<T>>;
}
