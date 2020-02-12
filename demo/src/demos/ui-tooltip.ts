import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, SvgIcon } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { ToolTip } from '../../../src/components/tooltip/tooltip';

// appendCSSTagOnce('icon-demo-container', `
// `)

register({
    title: '工具提示',
    cases: [
        {
            title: '[tooltip]',
            bootstrap: container => {
                bind(`
                    <div>
                        <span [tooltip]="message" class="">
                            纯文本提示
                        </span>
                    </div>
                    <div>
                        <span [tooltip]="message" [tooltipDelayTime]="2000" class="">
                            两秒后出现提示
                        </span>
                    </div>
                    <div>
                        <span [tooltip]="message" [tooltipPosition]="'top'" class="">
                            从上方出现提示
                        </span>
                    </div>
                    <div>
                        <span [tooltip]="message" [tooltipPosition]="'bottom'" class="">
                            从下方出现提示
                        </span>
                    </div>
                    <div>
                        <span [tooltip]="message" [tooltipPosition]="'left'" class="">
                            从左侧出现提示
                        </span>
                    </div>
                    <div>
                        <span [tooltip]="message" [tooltipPosition]="'right'" class="">
                            从右侧出现提示
                        </span>
                    </div>
                `, {
                    requirements: [ToolTip],
                    container: container,
                    state: {
                        message: '一段提示文本'
                    },
                })
            }
        }
    ]
})