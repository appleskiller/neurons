import { Property, Binding } from '../../binding/factory/decorator';
import { ListBase } from '../list/listbase';
import { CheckItem } from './check';
import { IItemState, IItemStateStatic } from '../interfaces';
import { theme } from '../style/theme';

@Binding({
    selector: 'ne-check-h-group-item-wrapper',
    template: `
        <ne-check-item 
            [checkMode]="(params && params.checkMode) ? params.checkMode : 'multi'"
            [checkStyle]="(params && params.checkStyle) ? params.checkStyle : 'checkbox'"
            [checkPosition]="(params && params.checkPosition) ? params.checkPosition : 'before'"
            [(checked)]="selected"
        >{{label}}</ne-check-item>
    `,
    requirements: [CheckItem]
})
export class HorizontalCheckGroupItemWrapper implements IItemState<any> {
    @Property() item: any = null;
    @Property() itemIndex: number = -1;
    @Property() selected: boolean = false;
    @Property() label: string = '';
    @Property() params: any;
}

@Binding({
    selector: 'ne-check-h-group',
    template: `
        <div #content [class]="{'ne-check-h-group': true}">
            <div #content class="ne-list-content"></div>
        </div>
    `,
    style: `
        .ne-check-h-group {
            overflow: auto;
        }
        .ne-check-h-group .ne-list-content .ne-list-item {
            display: inline-block;
            vertical-align: middle;
        }
        .ne-check-h-group .ne-list-content .ne-list-item .ne-check-item[check-style=capsule] {
            border-radius: 0;
            border-right: solid 1px ${theme.gray.light};
        }
        .ne-check-h-group .ne-list-content .ne-list-item:first-child .ne-check-item[check-style=capsule] {
            border-top-left-radius: 36px;
            border-bottom-left-radius: 36px;
            padding-left: 16px;
        }
        .ne-check-h-group .ne-list-content .ne-list-item:last-child .ne-check-item[check-style=capsule] {
            border-top-right-radius: 36px;
            border-bottom-right-radius: 36px;
            padding-right: 16px;
            border-right: none;
        }
    `,
})
export class HorizontalCheckGroup<T> extends ListBase<T> {
    @Property() checkStyle: 'checkbox' | 'radio' | 'check' | 'highlight' | 'background' | 'capsule' | 'tag' | 'edge' | 'v-edge' = 'checkbox';
    @Property() checkPosition: 'before' | 'after' = 'before';
    @Property() itemRenderer: IItemStateStatic<T> = HorizontalCheckGroupItemWrapper;
    getItemParams(item: T, index: number) {
        const result = {
            checkStyle: this.checkStyle === 'tag' ? 'capsule' : this.checkStyle,
            checkPosition: this.checkPosition,
            checkMode: this.enableMultiSelection ? 'multi' : 'single',
        }
        if (!this.itemRendererParams) return result;
        const parmas = typeof this.itemRendererParams === 'function' ? this.itemRendererParams.call(null, item, index) : this.itemRendererParams;
        return Object.assign(result, parmas || {});
    }
}
