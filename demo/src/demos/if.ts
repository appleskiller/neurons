import { register } from "../demos";
import { bind } from "../../../src";
import { randomStrings, randomTexts } from '../utils';

register({
    title: '*if',
    cases: [
        {
            title: '*if="value === true"',
            bootstrap: container => {
                bind(`
                    <button (click)="data.value = !data.value">切换</button>
                    <span *if="data.value">文本内容 1</span>
                    <span *if="!data.value">文本内容 2</span>
                `, {
                    container: container,
                    state: {
                        data: {
                            value: true
                        }
                    }
                });
            }
        }
    ]
})