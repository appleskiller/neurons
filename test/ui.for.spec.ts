
import { IEmitter, ui } from '../src';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { Property, UIBinding } from '../src/ui/factory/decorator';

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
    describe('*for', () => {
        describe('', () => {
            const dom = nativeApi.createElement('div', '', {
                position: 'absolute',
                top: '0%',
                right: '0%',
                width: '50px',
                height: '30px',
                background: '#CCC'
            });
            document.body.appendChild(dom);
            const ref = ui.bind(`
                <div>
                    <div *for="item in dataProvider">{{item}}</div>
                </div>`, {
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