

import { IEmitter } from 'neurons-emitter';
import { isDate, isDefined, ObjectAccessor } from 'neurons-utils';
import { Binding, Emitter, Property } from '../../binding/factory/decorator';
import { loop } from '../icon/icons';
import { SvgIcon } from '../icon/svgicon';
import { ISelectionChangeEvent } from '../interfaces';

export function defaultLabelFunction(item, labelField): string {
    if (isDefined(item)) {
        if (isDate(item)) {
            return (item as Date).toLocaleString();
        } else if (typeof item === 'object' && labelField) {
            if (labelField.indexOf('.') !== -1) {
                const accessor = new ObjectAccessor(item);
                const v = accessor.get(labelField);
                if (v === ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                    return '';
                } else {
                    return isDefined(v) ? v : '';
                }
            } else {
                return item[labelField];
            }
        } else {
            return item;
        }
    }
    return '';
}
export function defaultIconFunction(item, iconField, defaultIcon): string {
    if (isDefined(item)) {
        if (iconField && typeof item === 'object' && !isDate(item)) {
            if (iconField.indexOf('.') !== -1) {
                const accessor = new ObjectAccessor(item);
                const v = accessor.get(iconField);
                if (v === ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                    return '';
                } else {
                    return isDefined(v) ? v : '';
                }
            } else {
                return iconField in item ? item[iconField] : defaultIcon;
            }
        }
    }
    return defaultIcon;
}

@Binding({
    selector: 'ne-switch-button',
    template: `
        <div [class]="{'ne-switch-button': true, 'disabled': disabled}" (click)="onClick($event)">
            <ne-icon [icon]="getItemIcon()"></ne-icon>
            <div class="ne-switch-button-inffix">{{getItemLabel()}}</div>
        </div>
    `,
    style: `
        .ne-switch-button {
            display: inline-block;
            padding: 6px 12px;
            text-align: center;
            user-select: none;
            cursor: pointer;
            color: rgba(0, 0, 0, 0.8);
            border-radius: 3px;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            -webkit-transition: all 280ms cubic-bezier(.4,0,.2,1);
            transition: all 280ms cubic-bezier(.4,0,.2,1);
            text-overflow: ellipsis;
            white-space: nowrap;
            word-break: break-all;
            overflow: hidden;
            .ne-switch-button-inffix {
                display: inline-block;
                font-size: inherit;
                margin-left: 6px;
            }
            &:hover {
                color: rgba(0, 0, 0, 1);
                background-color: rgba(125,125,125,0.12);
            }
            &:not(.disabled):active {
                background-color: rgba(125,125,125,0.24);
            }
            &.disabled {
                opacity: 0.2;
                color: rgba(0, 0, 0, 0.8);
                cursor: default;
            }
        }
    `,
    requirements: [
        SvgIcon
    ]
})
export class SwitchButton {
    @Property() disabled = false;
    @Property() dataProvider: any[] = [];
    @Property() selectedItem = undefined;
    @Property() icon = loop;
    @Property() labelField: string = 'label';
    @Property() labelFunction = (item) => defaultLabelFunction(item, this.labelField);
    @Property() iconField: string = 'icon';
    @Property() iconFunction;
    @Property() filterFunction: (item) => boolean;

    @Emitter() selectedItemChange: IEmitter<any>;
    @Emitter() selectionChange: IEmitter<ISelectionChangeEvent<any>>;
    @Emitter() change: IEmitter<void>;

    onClick(e: MouseEvent) {
        if (this.disabled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            if (!this.dataProvider || !this.dataProvider.length) {
                this.setSelectedItem(undefined);
            } else {
                let index = this.dataProvider.indexOf(this.selectedItem);
                index = index < 0 ? 0 : index;
                index += 1;
                index = index >= this.dataProvider.length ? 0 : index;
                this.setSelectedItem(this.dataProvider[index]);
            }
        }
    }
    getItemIcon() {
        if (this.iconFunction) return this.iconFunction(this.selectedItem);
        return defaultIconFunction(this.selectedItem, this.iconField, this.icon || loop);
    }
    getItemLabel() {
        if (this.labelFunction) return this.labelFunction(this.selectedItem);
        return defaultLabelFunction(this.selectedItem, this.labelField);
    }
    protected setSelectedItem(item) {
        if (this.selectedItem !== item) {
            this.selectedItem = item;
            this.selectedItemChange.emit(this.selectedItem);
            this.selectionChange.emit({
                selectedItem: this.selectedItem,
                dataProvider: this.dataProvider,
                oldSelectedItem: item
            });
            this.change.emit();
        }
    }
}
