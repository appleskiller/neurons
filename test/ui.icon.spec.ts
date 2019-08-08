
import { IEmitter, ui } from '../src';
import { nativeApi } from '../src/ui/compiler/common/domapi';
import { Property, UIBinding } from '../src/ui/factory/decorator';
import { ISVGIcon } from '../src/utils/domutils';

const uncheckIcon: ISVGIcon = {
    prefix: 'ne-check-box',
    iconName: 'uncheck',
    icon: [1024, 1024, [], '', 'M64.00056 192.640399v638.719202C64.00056 902.911511 121.280488 959.99944 192.640399 959.99944h638.719202c71.487911 0 128.639839-57.279928 128.639839-128.639839V192.640399C959.99944 121.088489 902.719512 64.00056 831.359601 64.00056H192.640399C121.088489 64.00056 64.00056 121.280488 64.00056 192.640399z m-63.99992 0A192.19176 192.19176 0 0 1 192.640399 0.00064h638.719202A192.19176 192.19176 0 0 1 1023.99936 192.640399v638.719202A192.19176 192.19176 0 0 1 831.359601 1023.99936H192.640399A192.19176 192.19176 0 0 1 0.00064 831.359601V192.640399z']
}
const checkIcon: ISVGIcon = {
    prefix: 'ne-check-box',
    iconName: 'check',
    icon: [1024, 1024, [], '', 'M278.755556 403.911111l-79.644445 79.644445L455.111111 739.555556l568.888889-568.888889-79.644444-79.644445L455.111111 580.266667l-176.355555-176.355556zM910.222222 910.222222H113.777778V113.777778h568.888889V0H113.777778C51.2 0 0 51.2 0 113.777778v796.444444c0 62.577778 51.2 113.777778 113.777778 113.777778h796.444444c62.577778 0 113.777778-51.2 113.777778-113.777778V455.111111h-113.777778v455.111111z']
}

describe('ui.icon', () => {
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
    describe('ui.icon', () => {
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
                    <ne-icon [icon]="icon"/>
                </div>`, {
                container: dom,
                state: {
                    icon: uncheckIcon,
                }
            });
            ref.setState({
                icon: checkIcon,
            })
        });
        
    });
});