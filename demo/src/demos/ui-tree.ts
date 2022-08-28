import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, Tree, SearchableTree } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Input } from '../../../src/components/input/input';
import { NumberInput } from '../../../src/components/input/number';
import { SearchInput } from '../../../src/components/input/search';
import { TextArea } from '../../../src/components/input/textarea';

const treeDatas = [{
    value: '节点 1',
    label: '节点 1',
    children: [{
        value: '节点 1.1',
        label: '节点 1.1',
    }, {
        value: '节点 1.2',
        label: '节点 1.2',
    }]
}, {
    value: '节点 2',
    label: '节点 2',
    children: [{
        value: '节点 2.1',
        label: '节点 2.1',
        children: [{
            value: '节点 2.1.1',
            label: '节点 2.1.1',
        }]
    }, {
        value: '节点 2.2',
        label: '节点 2.2',
    }]
}, {
    value: '节点 3',
    label: '节点 3',
}, {
    value: '节点 4',
    label: '节点 4',
}];

appendCSSTagOnce('ui-tree-demo', `
`)
register({
    title: '树',
    cases: [
        {
            title: 'ne-tree',
            bootstrap: container => {
                bind(`
                    <ne-tree 
                        [dataProvider]="dataProvider"
                    ></ne-tree>
                `, {
                    requirements: [Tree],
                    container: container,
                    state: {
                        dataProvider: treeDatas,
                    }
                })
            }
        }, {
            title: 'ne-searchable-tree',
            bootstrap: container => {
                bind(`
                    <ne-searchable-tree 
                        [dataProvider]="dataProvider"
                    ></ne-searchable-tree>
                `, {
                    requirements: [SearchableTree],
                    container: container,
                    state: {
                        dataProvider: treeDatas,
                    }
                })
            }
        }
    ]
})