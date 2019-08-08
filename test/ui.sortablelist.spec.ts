


import { popupManager } from '../src/ui/cdk/popup/manager'
import { UIBinding, Property } from '../src/ui/factory/decorator';
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
            const dom = nativeApi.createElement('div', '', {
                position: 'absolute',
                top: '48px',
                right: '0%',
                width: '150px',
                height: '130px',
                background: '#CCC'
            });
            document.body.appendChild(dom);
            const ref = ui.bind(`<ne-sortable-list
                [dataProvider]="dataProvider"
            ></ne-sortable-list>`, {
                container: dom,
                state: {
                    dataProvider: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                }
            })
        });
        
    });
});