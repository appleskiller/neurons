import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, theme } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { List } from '../../../src/components/list/list';
import { CollapsibleList } from '../../../src/components/list/collapsiblelist';
import { SearchableList } from '../../../src/components/list/seachablelist';
import { SortableList } from '../../../src/components/list/sortablelist';

appendCSSTagOnce('list-demo-container', `
.list-demo-container {
    position: relative;
}
.list-demo-container .ne-list-item {
    
}
.list-demo-container .ne-list .ne-list-item.selected {
    background-color: ${theme.color.primary};
    color: #FFFFFF;
}
.collapsible-list-demo-container.multi-line {
    height: 80px;
}
.collapsible-list-demo-container .ne-collapsible-list .ne-collapsible-list-item {
    padding: 6px 6px;
}
.collapsible-list-demo-container .ne-collapsible-list .ne-collapsible-list-item.selected {
    background-color: ${theme.color.primary};
    color: #FFFFFF;
}
`)

register({
    title: '列表',
    cases: [
        {
            title: 'ne-list',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ', 1000);
                const state = {
                    dataProvider: dataProvider,
                    selectedItem: null,
                    onChange: () => {
                    }
                }
                const ref = bind(`
                    <div class="list-demo-container">
                        <ne-list
                            [dataProvider]="dataProvider"
                            (selectionChange)="onChange()"
                        ></ne-list>
                    </div>
                `, {
                    requirements: [List],
                    container: container,
                    state: state
                });
            }
        }, {
            title: 'ne-collapsible-list',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ', 1000);
                bind(`
                    <div>单行：</div>
                    <div class="collapsible-list-demo-container">
                        <ne-collapsible-list
                            [dataProvider]="dataProvider"
                        ></ne-collapsible-list>
                    </div>
                    <div>多行：</div>
                    <div class="collapsible-list-demo-container multi-line">
                        <ne-collapsible-list
                            [dataProvider]="dataProvider"
                            [listStyle]="'multi-line'"
                        ></ne-collapsible-list>
                    </div>
                `, {
                    requirements: [CollapsibleList],
                    container: container,
                    state: {
                        dataProvider: dataProvider
                    }
                })
            }
        }, {
            title: 'ne-searchable-list',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ', 1000);
                bind(`
                    <div class="list-demo-container">
                        <ne-searchable-list
                            [dataProvider]="dataProvider"
                        ></ne-searchable-list>
                    </div>
                `, {
                    requirements: [SearchableList],
                    container: container,
                    state: {
                        dataProvider: dataProvider
                    }
                })
            }
        }, {
            title: 'ne-sortable-list',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ', 1000);
                bind(`
                    <div class="list-demo-container">
                        <ne-sortable-list
                            [dataProvider]="dataProvider"
                        ></ne-sortable-list>
                    </div>
                `, {
                    requirements: [SortableList],
                    container: container,
                    state: {
                        dataProvider: dataProvider
                    }
                })
            }
        }
        // , {
        //     title: 'ne-tile-list',
        //     bootstrap: container => {
        //         const dataProvider = randomStrings('项目 ', 1000);
        //         bind(`
        //             <div class="list-demo-container">
        //                 <ne-tile-list
        //                     [dataProvider]="dataProvider"
        //                     [columnCount]="3"
        //                 ></ne-tile-list>
        //             </div>
        //         `, {
        //             container: container,
        //             state: {
        //                 dataProvider: dataProvider
        //             }
        //         })
        //     }
        // }
    ]
})