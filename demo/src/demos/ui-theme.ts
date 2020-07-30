import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, theme, SvgIcon, bindTheme } from "../../../src";
import { IEmitter, emitter } from 'neurons-emitter';
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Button } from '../../../src/components/button/button';

appendCSSTagOnce('theme-demo-container', `
`)

register({
    title: '主题',
    cases: [
        {
            title: '样式绑定',
            bootstrap: container => {
                const theme = {
                    padding: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 125, 125, 0.24)',
                    borderRadius: 3,
                    paddingLeft: 24,
                    color: 'red',
                    backgroundColor: 'rgba(125, 125, 125, 0.24)'
                };
                const ref = bindTheme(`
                    .ui-theme-binding {
                        color: {{color}};
                        background-color: rgba(125, 125, 125, 0.24);
                        padding: {{padding}}px;
                        .ui-theme-binding-content {
                            background-color: {{backgroundColor}};
                        }
                        border: solid {{borderWidth}}px {{borderColor}};
                        .ui-theme-binding-content {
                            .ui-theme-binding-content-inside {
                                line-height: 46px;
                                & > * {
                                    margin-right: 12px;
                                    display: inline-block;
                                    vertical-align: middle;
                                }
                            }
                            .ui-theme-binding-content-inside {
                                & > .ne-button {
                                    line-height: 24px;
                                }
                            }
                        }
                    }
                    .ui-theme-binding {
                        .ui-theme-binding-content {
                            .ui-theme-binding-content-inside {
                                padding-left: {{paddingLeft}}px;
                            }
                        }
                        border-radius: {{borderRadius}}px;
                    }
                `, theme);
                bind(`
                    <div class="ui-theme-binding">
                        <div class="ui-theme-binding-content">
                            <div class="ui-theme-binding-content-inside">
                                <span>一段文字</span>
                                <ne-button mode="flat" color="primary" (click)="onChange()">变更样式</ne-button>
                                <ne-button mode="flat" color="primary" (click)="onClear()">销毁</ne-button>
                            </div>
                        </div>
                    </div>
                `, {
                    requirements: [Button, SvgIcon],
                    container: container,
                    state: {
                        onChange: () => {
                            ref.setState({
                                color: `rgba(${Math.floor(255 * Math.random())}, ${Math.floor(255 * Math.random())}, ${Math.floor(255 * Math.random())}, 1)`,
                                backgroundColor: `rgba(${Math.floor(125 * Math.random())}, ${Math.floor(125 * Math.random())}, ${Math.floor(125 * Math.random())}, 0.24)`,
                            });
                        },
                        onClear: () => {
                            ref.destroy();
                        }
                    }
                });
            }
        }
    ]
})