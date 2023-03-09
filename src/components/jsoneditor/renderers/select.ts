import { Binding } from "../../../binding";
import { isEmpty } from "neurons-utils";
import { PropertyRendererBase } from "./base";
import { DropDownList } from "../../dropdown/dropdown";

@Binding({
    selector: 'ui-jse-select',
    template: `
        <div class="ui-jse-select ui-jse-renderer" jse-renderer="SELECT"
            [no-title]="!!title ? null : ''"
            (mouseenter)="showTooltip($event.currentTarget)"
            (mouseleave)="hideTooltip()"
            [style.padding-left]="indentWidth"
        >
            <div class="ui-jse-renderer-title" [style.padding-left]="indentWidth">{{title}}</div>
            <div class="ui-jse-renderer-content">
                <ne-dropdown-list
                    [readonly]="readonly"
                    [dataProvider]="dataProvider"
                    [(selectedItem)]="selectedItem"
                    (selectionChange)="onSelectionChange($event)"
                ></ne-dropdown-list>
            </div>
        </div>
    `,
    style: `
        .ui-jse-select {
            .ne-dropdown-list-trigger {
                line-height: 21px;
            }
        }
    `,
    requirements: [
        DropDownList
    ]
})
export class SelectRenderer extends PropertyRendererBase {

    dataProvider: any[] = [];
    selectedItem: any;

    updateComponent() {
        super.updateComponent();
        const schema = this.node.schema;
        const enums = schema.enum || [];
        const enumsAlias = schema.enumsAlias || null;
        const enumsOrder = schema.enumsOrder || [];
        this.dataProvider = enums.map(value => {
            return {
                label: this._getValueAlias(value, enumsAlias),
                value: value
            }
        });
        this.dataProvider = this.sortEnums(this.dataProvider, enumsOrder);
        this.selectedItem = this.dataProvider.find(item => item.value === this.value);
    }
    onSelectionChange() {
        this.setValue(this.selectedItem ? this.selectedItem.value : null);
    }
    sortEnums(list: any[], orders: any[]) {
        if (!list || !orders || !list.length || !orders.length) {
            return list;
        }
        const indexMap = {};
        orders.forEach((key, index) => (indexMap[key] = index));
        const result = [], remains = [];
        list.forEach(item => {
            indexMap[item.value] === undefined ? remains.push(item) : result.push(item);
        })
        return result.sort((a, b) => {
            return indexMap[a.value] - indexMap[b.value];
        }).concat(remains);
    }
    private _getValueAlias(value, enumsAlias?) {
        if (enumsAlias && !isEmpty(enumsAlias) && value in enumsAlias) {
            return enumsAlias[value];
        } else {
            return value;
        }
    }
}

