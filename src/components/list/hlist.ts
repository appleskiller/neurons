import { Binding } from '../../binding/factory/decorator';
import { DefaultItemState } from './list';
import { ListBase } from './listbase';

@Binding({
    selector: 'ne-h-list',
    template: `
        <div [class]="{'ne-list': true, 'ne-h-list': true, 'enable-selection': enableSelection}">
            <div #content class="ne-list-content"></div>
        </div>
    `,
    style: `
        .ne-h-list {
            position: relative;
            overflow: auto;
        }
    `,
    requirements: [
        DefaultItemState,
    ]
})
export class HorizontalList<T> extends ListBase<T> {
}

