
import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, theme } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { NumberInput } from '../../../src/components/input/number';
import { DropDownList } from '../../../src/components/dropdown/dropdown';

appendCSSTagOnce('dropdown-demo-container', `
`)

register({
    title: '下拉列表',
    cases: [
        {
            title: 'ne-dropdown-list',
            bootstrap: container => {
                const data = {
                    amount: 1000,
                    threshold: 100,
                }
                const ref = bind(`
                    <div>
                        数量
                        <ne-number-input [(value)]="data.amount" (change)="onAmountChange()"></ne-number-input>
                    </div>
                    <div>
                        超过
                        <ne-number-input [(value)]="data.threshold"></ne-number-input>后出现搜索框
                    </div>
                    <div class="list-demo-container">
                        <ne-dropdown-list
                            modalMode="true"
                            enableMultiSelection="true"
                            [dataProvider]="dataProvider"
                            [searchableThreshold]="data.threshold"
                        ></ne-dropdown-list>
                    </div>
                `, {
                    requirements: [NumberInput, DropDownList],
                    container: container,
                    state: {
                        dataProvider: randomStrings('项目 ', data.amount),
                        data: data,
                        onAmountChange: () => {
                            ref.setState({
                                dataProvider: randomStrings('项目 ', data.amount)
                            })
                        }
                    }
                });
            }
        }
    ]
})