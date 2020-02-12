import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Input } from '../../../src/components/input/input';
import { NumberInput } from '../../../src/components/input/number';
import { SearchInput } from '../../../src/components/input/search';
import { TextArea } from '../../../src/components/input/textarea';

appendCSSTagOnce('ui-input-demo', `
.ui-input-demo-row > * {
    display: inline-block;
    vertical-align: top;
    width: 25%;
    padding: 8px 0;
}
`)
register({
    title: '输入框',
    cases: [
        {
            title: 'ne-input',
            bootstrap: container => {
                bind(`
                    <div class="ui-input-demo-row">
                        <div>普通</div>
                        <div>只读</div>
                        <div>禁用</div>
                        <div>必填</div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div><ne-input placeholder="请输入..." ></div>
                        <div><ne-input [readonly]="true" [value]="'一行文本'"></div>
                        <div><ne-input [disabled]="true" [value]="'一行文本'"></div>
                        <div><ne-input placeholder="请输入..." [required]="true"></div>
                    </div>
                `, {
                    requirements: [Input],
                    container: container,
                })
            }
        }, {
            title: 'ne-number-input',
            bootstrap: container => {
                bind(`
                    <div class="ui-input-demo-row">
                        <div>普通</div>
                        <div>只读</div>
                        <div>禁用</div>
                        <div>必填</div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div><ne-number-input placeholder="请输入..." ></div>
                        <div><ne-number-input [readonly]="true" [value]="1000"></div>
                        <div><ne-number-input [disabled]="true" [value]="1000"></div>
                        <div><ne-number-input placeholder="请输入..." [required]="true"></div>
                    </div>
                `, {
                    requirements: [NumberInput],
                    container: container,
                })
            }
        }, {
            title: 'ne-search-input',
            bootstrap: container => {
                bind(`
                    <div class="ui-input-demo-row">
                        <div>普通</div>
                        <div>只读</div>
                        <div>禁用</div>
                        <div>必填</div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div><ne-search-input placeholder="搜索..." ></div>
                        <div><ne-search-input [readonly]="true" [value]="'搜索文本'"></div>
                        <div><ne-search-input [disabled]="true" [value]="'搜索文本'"></div>
                        <div><ne-search-input placeholder="搜索..." [required]="true"></div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div>点击展开的搜索框</div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div style="text-align: right;">
                            <ne-search-input style="display: inline-block;" placeholder="搜索..." [collapsible]="true">
                        </div>
                    </div>
                `, {
                    requirements: [SearchInput],
                    container: container,
                })
            }
        }, {
            title: 'ne-textarea',
            bootstrap: container => {
                bind(`
                    <div class="ui-input-demo-row">
                        <div>普通</div>
                        <div>只读</div>
                        <div>禁用</div>
                        <div>必填</div>
                    </div>
                    <div class="ui-input-demo-row">
                        <div><ne-textarea placeholder="搜索..." ></div>
                        <div><ne-textarea [readonly]="true" [value]="'搜索文本'"></div>
                        <div><ne-textarea [disabled]="true" [value]="'搜索文本'"></div>
                        <div><ne-textarea placeholder="搜索..." [required]="true"></div>
                    </div>
                `, {
                    requirements: [TextArea],
                    container: container,
                })
            }
        }
    ]
})