
import { popupManager } from '../src/ui/cdk/popup/manager'
import { UIBinding, Property } from '../src/ui/factory/decorator';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { List } from '../src/ui/components/list/list';

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
            @UIBinding({ selector: 'popup-inner-binding', template: '<div *for="text in testArray">{{text}}</div>' })
            class TestUIBinding {
                @Property() testArray = ['1', '2', '3', '4'];
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
            nativeApi.addEventListener(dom, 'click', () => {
                popupManager.open(TestUIBinding, {
                    state: {
                        testArray: [
                            '1111111111111111111111111111',
                            '2222222222222222222222222222',
                            '3333333333333333333333333333',
                            '4444444444444444444444444444',
                            '555555555555555',
                            '2222222222222222222222222222',
                            '3333333333333333333333333333',
                            '4444444444444444444444444444'
                        ]
                    },
                    binding: {
                        '[testArray]': 'testArray'
                    },
                    connectElement: dom,
                    popupMode: 'dropdown',
                    position: 'bottom',
                    overlayBackgroundColor: 'transparent'
                })
            });
        });
        
    });
});