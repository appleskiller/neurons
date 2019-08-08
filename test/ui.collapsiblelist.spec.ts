


import { popupManager } from '../src/ui/cdk/popup/manager'
import { UIBinding, Property } from '../src/ui/factory/decorator';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { ui, IEmitter } from '../src';

describe('ui.collapsiblelist', () => {
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
    describe('ui.collapsiblelist', () => {
        describe('', () => {
            const dom = nativeApi.createElement('div', '', {
                position: 'absolute',
                top: '0%',
                right: '0%',
                width: '150px',
                height: '40px',
                background: '#CCC'
            });
            document.body.appendChild(dom);
            ui.bind(`<ne-collapsible-list
                [dataProvider]="dataProvider"
            ></ne-collapsible-list>`, {
                container: dom,
                state: {
                    dataProvider: [111111, 222222, 3333333, 444444, 555555]
                }
            })
        });
        
    });
});