import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { IEmitter, emitter } from 'neurons-emitter';

@Binding({
    selector: 'input-output-demo',
    template: `
        <div class="input-output-demo">
            <button (click)="onChange()">从内部改变值</button>
            {{label}}
        </div>
    `,
    style: `
        .input-output-demo {
            border: solid 1px rgba(125, 125, 125, 0.24);
            border-radius: 3px;
        }
    `
})
class InputOutputDemo {
    @Property() label: string;
    @Emitter() labelChange: IEmitter<string> = emitter('label_change');
    onChange() {
        this.label = Math.random() + '';
        this.labelChange.emit(this.label);
    }
}

const injectToken = 'VALUE';

@Binding({
    selector: 'ui-inject-demo',
    template: `
        <div>
            {{value}}
        </div>
    `,
    style: ``
})
class UiInjectDemo {
    @Property() label: string;
    @Inject(injectToken) value: string;
}

register({
    title: 'binding',
    cases: [
        {
            title: '简单内容',
            bootstrap: container => {
                bind(`
                    一段静态内容。
                    <br/>
                    <span style="color: green;">{{text}}</span>
                `, {
                    container: container,
                    state: {
                        text: '来自绑定数据的文本内容'
                    }
                })
            }
        }, {
            title: '插入位置',
            bootstrap: container => {
                const ref = bind(`
                    <div #content style="border: solid 1px rgba(125,125,125,0.24); border-radius: 3px; padding: 4px 8px;"></div>
                `, {
                    container: container
                });
                const content = ref.element('content') as HTMLElement;
                bind(`
                    <span style="color: orange;">元素上方的内容</span>
                `, {
                    placeholder: content
                });
                bind(`
                    <span style="color: green;">元素内部的内容</span>
                `, {
                    container: content
                });
            }
        }, {
            title: '转义控制',
            bootstrap: container => {
                const ref = bind(`
                    <div>
                        转义内容：
                        <div>{{innerHTML}}</div>
                    </div>
                    <div>
                        未转义内容：
                        <div [innerHTML]="innerHTML"></div>
                    </div>
                `, {
                        container: container,
                        state: {
                            innerHTML: '<div style="color: green;">html文本</div>'
                        }
                    });
            }
        }, {
            title: '状态变更',
            bootstrap: container => {
                const ref = bind(`
                    <div>
                        <button (click)="onChangeValue($event)">设置0~1随机数</button>
                        <input (input)="onChangeInput($event)" placeholder="输入文本" [value]="value">
                    </div>
                    <div>
                        <span>{{value}}</span>
                    </div>
                `, {
                    container: container,
                    state: {
                        value: 0,
                        onChangeValue: () => {
                            ref.setState({value: Math.random()})
                        },
                        onChangeInput: (e) => {
                            ref.setState({ value: e.currentTarget.value })
                        },
                    }
                });
            }
        }, {
            title: '原生元素增强',
            bootstrap: container => {
                const ref = bind(`
                    <div>
                        单行文本：<input [(value)]="inputValue">
                        绑定值：<span style="color: green;">{{inputValue}}</span>
                    </div>
                    <div>
                        checkbox：<input type="checkbox" [(checked)]="checkedValue" value="ddd">
                        绑定值：<span style="color: green;">{{checkedValue}}</span>
                    </div>
                    <div>
                        radio: 
                        <input type="radio" [checked]="radioValue == 1" (checkedChange)="onCheckedChange($event, 1)" value="1">选项1
                        <input type="radio" [checked]="radioValue == 2" (checkedChange)="onCheckedChange($event, 2)" value="2">选项2
                        <input type="radio" [checked]="radioValue == 3" (checkedChange)="onCheckedChange($event, 3)" value="3">选项3
                        绑定值：<span style="color: green;">{{radioValue}}</span>
                    </div>
                    <div>
                        多行文本：<textarea [(value)]="textValue"/>
                        绑定值：<span style="color: green;">{{textValue}}</span>
                    </div>
                `, {
                    container: container,
                    state: {
                        inputValue: '1000',
                        checkedValue: true,
                        radioValue: 1,
                        textValue: '一段文本',
                        onCheckedChange: (checked, value) => {
                            checked && ref.setState({radioValue: value})
                        }
                    }
                });
            }
        }, {
            title: '绑定DOM对象',
            bootstrap: container => {
                const dom = document.createElement('button');
                bind(dom, {
                    container: container,
                    hostBinding: {
                        '[innerHTML]': 'label',
                        '(click)': 'onClick($event)',
                    },
                    state: {
                        label: '点击弹出对话框',
                        onClick: e => {
                            window.alert('无内容');
                        }
                    }
                });
            }
        }, {
            title: 'property & emitter & two-way binding',
            bootstrap: container => {
                bind(`
                    外部绑定值：<input [(value)]="value">
                    <input-output-demo
                        [(label)]="value"
                    ></input-output-demo>
                `, {
                    container: container,
                    state: {
                        value: Math.random() + ''
                    }
                })
            }
        }, {
            title: '使用binding api创建实例',
            bootstrap: container => {
                const ref = bind(`
                    <div>
                        从模板创建:
                        <div #templateCase></div>
                    </div>
                    <div>
                        从selector创建:
                        <div #selectorCase></div>
                    </div>
                    <div>
                        从类对象创建:
                        <div #classCase></div>
                    </div>
                `, {
                    container: container,
                });
                const templateCase = ref.element('templateCase') as HTMLElement;
                const state = {
                    value: Math.random() + ''
                }
                bind(`
                    <input-output-demo
                        [(label)]="value"
                    ></input-output-demo>
                `, {
                    container: templateCase,
                    state: state
                })
                const selectorCase = ref.element('selectorCase') as HTMLElement;
                bind(`input-output-demo`, {
                    container: selectorCase,
                    hostBinding: {
                        '[(label)]': "value"
                    },
                    state: state
                });
                const classCase = ref.element('classCase') as HTMLElement;
                bind(InputOutputDemo, {
                    container: classCase,
                    hostBinding: {
                        '[(label)]': "value"
                    },
                    state: state
                });
            }
        }, {
            title: '动态绑定',
            bootstrap: container => {
                const settings = {
                    a: {
                        source: 'input-output-demo',
                        hostBinding: {
                            '[(label)]': "value"
                        },
                        state: {
                            value: Math.random() + ''
                        },
                    },
                    b: {
                        source: `
                            asdfasdfasdfasdf
                        `,
                        state: null,
                        hostBinding: null,
                    }
                }
                let switchValue = true;
                const state = {
                    settings: settings.a,
                    onClick: () => {
                        switchValue = !switchValue;
                        state.settings = switchValue ? settings.a : settings.b;
                    }
                }
                bind(`
                    <button (click)="onClick()">切换显示</button>
                    <ne-binding
                        [source]="settings.source"
                        [hostBinding]="settings.hostBinding"
                        [state]="settings.state"
                    ></ne-binding>
                `, {
                    container: container,
                        state: state,
                });
            }
        }, {
            title: '依赖注入',
            bootstrap: container => {
                bind(`
                    外部注入的值为：<ui-inject-demo></ui-inject-demo>
                `, {
                    container: container,
                    providers: [{
                        token: injectToken,
                        use: 'ABC'
                    }]
                });
            }
        }
    ]
})