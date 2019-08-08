
import { popupManager } from '../src/ui/cdk/popup/manager'
import { UIBinding, Property } from '../src/ui/factory/decorator';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { List } from '../src/ui/components/list/list';
import { ui } from '../src';

describe('ui.popup', () => {
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
    describe('popupmanager', () => {
        describe('factory.registerManifest() => analysis dependency', () => {
            const dom = nativeApi.createElement('div', '', {
                position: 'absolute',
                top: '80px',
                right: '0%',
                width: '120px',
                height: '24px',
                background: '#CCC'
            });
            document.body.appendChild(dom);
            const ref = ui.bind(`
                <ne-dropdown-list [dataProvider]="dataProvider">
                </ne-dropdown-list>`, {
                container: dom,
                state: {
                    dataProvider: [1],
                }
            });
            ref.setState({
                dataProvider: [5],
            })
        });
        
    });
});