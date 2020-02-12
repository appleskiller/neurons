import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, theme, SvgIcon } from "../../../src";
import { IEmitter, emitter } from 'neurons-emitter';
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Button } from '../../../src/components/button/button';

appendCSSTagOnce('button-demo-container', `
.ui-button-demo-row {
    padding: 12px 0;
}
.ui-button-demo-row > * {
    display: inline-block;
    vertical-align: middle;
    width: 128px;
    margin: 0 6px;
}
.ui-button-demo-row > *:first-child {
    text-align: right;
}
.ui-button-demo-row > * > .ne-button {
    width: 100%;
}
`)

register({
    title: '按钮',
    cases: [
        {
            title: 'ne-button',
            bootstrap: container => {
                bind(`
                    <div class="ui-button-demo-row">
                        <div></div>
                        <div>基本</div>
                        <div>primary</div>
                        <div>passed color</div>
                        <div>error color</div>
                        <div>warn color</div>
                    </div>
                    <div class="ui-button-demo-row">
                        <div>Basic：</div>
                        <div>
                            <ne-button [mode]="'basic'">按钮</ne-button>
                            <ne-button [mode]="'basic'" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'basic'" color="primary">按钮</ne-button>
                            <ne-button [mode]="'basic'" color="primary" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'basic'" color="${theme.color.passed}">按钮</ne-button>
                            <ne-button [mode]="'basic'" color="${theme.color.passed}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'basic'" color="${theme.color.error}">按钮</ne-button>
                            <ne-button [mode]="'basic'" color="${theme.color.error}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'basic'" color="${theme.color.warn}">按钮</ne-button>
                            <ne-button [mode]="'basic'" color="${theme.color.warn}" [disabled]="true">按钮</ne-button>
                        </div>
                    </div>
                    <div class="ui-button-demo-row">
                        <div>Raised：</div>
                        <div>
                            <ne-button [mode]="'raised'">按钮</ne-button>
                            <ne-button [mode]="'raised'" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'raised'" color="primary">按钮</ne-button>
                            <ne-button [mode]="'raised'" color="primary" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'raised'" color="${theme.color.passed}">按钮</ne-button>
                            <ne-button [mode]="'raised'" color="${theme.color.passed}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'raised'" color="${theme.color.error}">按钮</ne-button>
                            <ne-button [mode]="'raised'" color="${theme.color.error}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'raised'" color="${theme.color.warn}">按钮</ne-button>
                            <ne-button [mode]="'raised'" color="${theme.color.warn}" [disabled]="true">按钮</ne-button>
                        </div>
                    </div>
                    <div class="ui-button-demo-row">
                        <div>Stroked：</div>
                        <div>
                            <ne-button [mode]="'stroked'">按钮</ne-button>
                            <ne-button [mode]="'stroked'" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'stroked'" color="primary">按钮</ne-button>
                            <ne-button [mode]="'stroked'" color="primary" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'stroked'" color="${theme.color.passed}">按钮</ne-button>
                            <ne-button [mode]="'stroked'" color="${theme.color.passed}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'stroked'" color="${theme.color.error}">按钮</ne-button>
                            <ne-button [mode]="'stroked'" color="${theme.color.error}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'stroked'" color="${theme.color.warn}">按钮</ne-button>
                            <ne-button [mode]="'stroked'" color="${theme.color.warn}" [disabled]="true">按钮</ne-button>
                        </div>
                    </div>
                    <div class="ui-button-demo-row">
                        <div>Flat：</div>
                        <div>
                            <ne-button [mode]="'flat'">按钮</ne-button>
                            <ne-button [mode]="'flat'" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'flat'" color="primary">按钮</ne-button>
                            <ne-button [mode]="'flat'" color="primary" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'flat'" color="${theme.color.passed}">按钮</ne-button>
                            <ne-button [mode]="'flat'" color="${theme.color.passed}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'flat'" color="${theme.color.error}">按钮</ne-button>
                            <ne-button [mode]="'flat'" color="${theme.color.error}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'flat'" color="${theme.color.warn}">按钮</ne-button>
                            <ne-button [mode]="'flat'" color="${theme.color.warn}" [disabled]="true">按钮</ne-button>
                        </div>
                    </div>
                    <div class="ui-button-demo-row">
                        <div>Simulated：</div>
                        <div>
                            <ne-button [mode]="'simulated'">按钮</ne-button>
                            <ne-button [mode]="'simulated'" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'simulated'" color="primary">按钮</ne-button>
                            <ne-button [mode]="'simulated'" color="primary" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'simulated'" color="${theme.color.passed}">按钮</ne-button>
                            <ne-button [mode]="'simulated'" color="${theme.color.passed}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'simulated'" color="${theme.color.error}">按钮</ne-button>
                            <ne-button [mode]="'simulated'" color="${theme.color.error}" [disabled]="true">按钮</ne-button>
                        </div>
                        <div>
                            <ne-button [mode]="'simulated'" color="${theme.color.warn}">按钮</ne-button>
                            <ne-button [mode]="'simulated'" color="${theme.color.warn}" [disabled]="true">按钮</ne-button>
                        </div>
                    </div>
                `, {
                    requirements: [Button, SvgIcon],
                    container: container,
                })
            }
        }
    ]
})