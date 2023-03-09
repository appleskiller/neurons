import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, SvgIcon } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { JsonEditor } from '../../../src/components/jsoneditor/editor';

const testSchema = {
    properties: {
        name: {
            title: '文本',
            description: '文本',
            type: 'string',
            order: 100,
            default: '',
            required: true,
        },
        number: {
            title: '数值',
            description: '数值',
            type: 'number',
            order: 100,
            default: 0,
            required: true,
        },
        date: {
            title: '日期',
            description: '日期',
            type: 'date',
            order: 100,
            default: 0,
            required: true,
        },
        hidden: {
            title: '布尔',
            description: '布尔',
            type: 'boolean',
            order: 200,
            default: true,
            required: true,
        },
        mode: {
            title: '下拉菜单',
            description: '下拉菜单',
            type: 'string',
            order: 300,
            renderer: 'select',
            enum: ['inline', 'block'],
            enumsAlias: {
                inline: '行内排列',
                block: '纵向排布',
            },
            default: 'block',
        },
        object: {
            title: '对象',
            description: '对象',
            type: 'object',
            order: 400,
            default: {},
            properties: {
                name: {
                    title: '文本',
                    description: '文本',
                    type: 'string',
                    order: 100,
                    default: '',
                    required: true,
                },
                hidden: {
                    title: '布尔',
                    description: '布尔',
                    type: 'boolean',
                    order: 200,
                    default: true,
                    required: true,
                },
                object: {
                    title: '对象',
                    description: '对象',
                    type: 'object',
                    order: 500,
                    default: {},
                    properties: {
                        name: {
                            title: '文本',
                            description: '文本',
                            type: 'string',
                            order: 100,
                            default: '',
                            required: true,
                        },
                        hidden: {
                            title: '布尔',
                            description: '布尔',
                            type: 'boolean',
                            order: 200,
                            default: true,
                            required: true,
                        },
                        dataProvider: {
                            title: '可选项列表',
                            description: '设置可选项列表',
                            type: 'array',
                            order: 500,
                            default: [],
                            items: {
                                type: 'number'
                            }
                        },
                    }
                }
            }
        },
        dataProvider: {
            title: '可选项列表',
            description: '设置可选项列表',
            type: 'array',
            order: 500,
            default: [],
            items: {
                type: 'number'
            }
        },
        
    }
}

const testObject = {
    name: '名称',
    hidden: true,
    date: new Date(),
    mode: 'inline',
    dataProvider: [
        1,
        2,
        3,
        4,
    ],
    object: {
        name: '名称',
        hidden: true,
    }
}

appendCSSTagOnce('ui-json-editor-demo', `
.ui-json-editor-demo {
    position: relative;
    width: 100%;
    max-height: 600px;
    overflow: hidden;
    box-sizing: border-box;
}
.ui-json-editor-demo .ui-json-editor-demo-left {
    position: relative;
    display: inline-block;
    vertical-align: top;
    width: calc(100% - 500px);
}
.ui-json-editor-demo .ui-json-editor-demo-right {
    width: 500px;
    max-height: 600px;
    position: relative;
    display: inline-block;
    vertical-align: top;
    overflow: auto;
}
`)

register({
    title: '对象编辑器',
    cases: [
        {
            title: '对象编辑器',
            bootstrap: container => {
                const state = {
                    schema: testSchema,
                    object: testObject,
                    jsonString: JSON.stringify(testObject),
                    onDataChange: () => {
                        state.jsonString = JSON.stringify(testObject);
                    }
                }
                bind(`
                    <div class="ui-json-editor-demo">
                        <div class="ui-json-editor-demo-left">{{jsonString}}</div>
                        <div class="ui-json-editor-demo-right">
                            <ui-json-editor [schema]="schema" [object]="object" (dataChange)="onDataChange()"></ui-json-editor>
                        </div>
                    </div>
                `, {
                    requirements: [JsonEditor],
                    container: container,
                    state: state,
                })
            }
        }
    ]
})
