import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, SvgIcon } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import '../../../src/components/icon/svgicon';
import { appendCSSTagOnce } from 'neurons-dom';

appendCSSTagOnce('icon-demo-container', `
.icon-demo-container > * {
    display: inline-block;
    vertical-align: top;
    width: 25%;
    padding: 8px 0;
}
.icon-demo-container > * > * {
    display: inline-block;
    vertical-align: middle;
    margin-right: 12px;
    line-height: 18px;
}
`)

register({
    title: '图标',
    cases: [
        {
            title: 'ne-icon',
            bootstrap: container => {
                const array = Object.values(icons);
                bind(`
                    <div class="icon-demo-container">
                        <div *for="item in array">
                            <div><ne-icon [icon]="item"></ne-icon></div>
                            <div>{{item.iconName}}</div>
                        </div>
                    </div>
                `, {
                    requirements: [SvgIcon],
                    container: container,
                    state: {
                        array: array,
                    },
                })
            }
        }
    ]
})