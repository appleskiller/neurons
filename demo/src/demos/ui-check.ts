import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons } from "../../../src";
import { IEmitter, emitter } from 'neurons-emitter';
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { CheckBox } from '../../../src/components/checkbox/checkbox';
import { CheckBoxGroup, CheckBoxGroupItem } from '../../../src/components/checkbox/checkboxgroup';
import { RadioButton } from '../../../src/components/radio/radiobutton';
import { RadioGroup } from '../../../src/components/radio/radiogroup';
import { HorizontalCheckGroup } from '../../../src/components/check/checkhgroup';

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
    title: '单选框&多选框',
    cases: [
        {
            title: 'ne-check-box',
            bootstrap: container => {
                bind(`
                    <ne-check-box>项目 1</ne-check-box>
                    <ne-check-box checked="true" [readonly]="true">项目 1（只读）</ne-check-box>
                    <ne-check-box checked="true" [disabled]="true">项目 1（禁用）</ne-check-box>
                `, {
                    requirements: [CheckBox],
                    container: container,
                })
            }
        }, {
            title: 'ne-checkbox-group',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ');
                bind(`
                    <ne-checkbox-group
                        [dataProvider]="dataProvider"
                    ></ne-checkbox-group>
                `, {
                    requirements: [CheckBoxGroup],
                    container: container,
                    state: {
                        dataProvider: dataProvider
                    }
                })
            }
        }, {
            title: 'ne-radio-button',
            bootstrap: container => {
                bind(`
                    <ne-radio-button>项目 1</ne-radio-button>
                    <ne-radio-button checked="true" [readonly]="true">项目 1（只读）</ne-radio-button>
                    <ne-radio-button checked="true" [disabled]="true">项目 1（禁用）</ne-radio-button>
                `, {
                    requirements: [RadioButton],
                    container: container,
                })
            }
        }, {
            title: 'ne-radio-group',
            bootstrap: container => {
                const dataProvider = randomStrings('项目 ');
                bind(`
                    <ne-radio-group
                        [dataProvider]="dataProvider"
                    ></ne-radio-group>
                `, {
                    requirements: [RadioGroup],
                    container: container,
                    state: {
                        dataProvider: dataProvider
                    }
                })
            }
        }, {
            title: 'ne-check-item & ne-check-h-group',
            bootstrap: container => {
                const checkStyles = ['checkbox', 'radio', 'check', 'highlight', 'background', 'capsule', 'edge', 'v-edge'];
                const checkPositions = ['before', 'after'];
                bind(`
                    <div>
                        风格：
                        <ne-check-h-group
                            [dataProvider]="checkStyles"
                            [(selectedItem)]="checkStyle"
                        />
                        位置：
                        <ne-check-h-group
                            [dataProvider]="checkPositions"
                            [(selectedItem)]="checkPosition"
                        />
                    </div>
                    <ne-check-item [checkStyle]="checkStyle" [checkPosition]="checkPosition">项目 1</ne-check-item>
                    <ne-check-item [checkStyle]="checkStyle" [checkPosition]="checkPosition">项目 2222</ne-check-item>
                    <ne-check-item [checkStyle]="checkStyle" [checkPosition]="checkPosition">项目 3</ne-check-item>
                `, {
                    requirements: [HorizontalCheckGroup],
                    container: container,
                    state: {
                        checkStyles: checkStyles,
                        checkPositions: checkPositions,
                        checkStyle: 'radio',
                        checkPosition: 'before',
                    }
                })
            }
        }
    ]
})