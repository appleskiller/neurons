


import { popupManager } from '../src/ui/cdk/popup/manager'
import { UIBinding, Property, Emitter } from '../src/ui/factory/decorator';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { ui, IEmitter } from '../src';

describe('ui.list', () => {
    beforeAll(() => {
        return new Promise((resolve) => {
            resolve();
        });
    });
    afterAll(() => {
        return new Promise((resolve) => {
            resolve();
        });
    });
    describe('list', () => {
        describe('', () => {
            @UIBinding({
                selector: 'list-binding',
                template: `
                    <ne-list
                        [dataProvider]="dataProvider"
                        [(selectedItems)]="selectedItems"
                    ></ne-list>
                `
            })
            class TestUIList {
                @Property() dataProvider = ['1'];
                @Property() selectedItems = [];
                @Emitter() selectedItemsChange: IEmitter<any>;
            }
            const dom = nativeApi.createElement('div', '', {
                position: 'absolute',
                top: '0%',
                right: '0%',
                width: '50px',
                height: '30px',
                background: '#CCC'
            });
            document.body.appendChild(dom);
            const ref = ui.bind(`<list-binding
                [dataProvider]="dataProvider"
            ></list-binding>`, {
                container: dom,
                state: {
                    dataProvider: [1, 2, 3, 4],
                    selectedItems: []
                }
            })
            ref.setState({
                dataProvider: [5,6,7,8]
            })
        });
        
    });
});