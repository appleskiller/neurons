import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, popupManager } from "../../../src";
import { IEmitter, emitter } from 'neurons-emitter';
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { CheckBox } from '../../../src/components/checkbox/checkbox';
import { CheckBoxGroup, CheckBoxGroupItem } from '../../../src/components/checkbox/checkboxgroup';
import { RadioButton } from '../../../src/components/radio/radiobutton';
import { RadioGroup } from '../../../src/components/radio/radiogroup';
import { HorizontalCheckGroup } from '../../../src/components/check/checkhgroup';
import { IPopupOption } from '../../../src/cdk/popup/interfaces';

appendCSSTagOnce('popup-demo-container', `
.popup-demo-settings {
    padding-bottom: 12px;
}
.popup-demo-container .ne-button {
    margin-right: 12px;
}
.popup-demo-panel {
    width: 240px;
    height: 180px;
    line-height: 180px;
    text-align: center;
}
`)

register({
    title: '弹出面板',
    cases: [
        {
            title: 'modal & dropdown & tooltip & sidepanel',
            bootstrap: container => {
                const modes = ['modal', 'dropdown', 'tooltip', 'sidepanel'];
                const state = {
                    modes: modes,
                    mode: 'modal',
                    showPopup: (e: MouseEvent, position) => {
                        const connectElement = (state.mode === 'modal' || state.mode === 'sidepanel') ? null : e.currentTarget as HTMLElement;
                        const settings: IPopupOption<any> = {
                            connectElement: connectElement,
                            popupMode: state.mode,
                            position: position,
                        }
                        if (state.mode === 'sidepanel') {
                            settings.width = 240;
                            settings.height = 180;
                        }
                        popupManager.open(`
                            <div class="popup-demo-panel">
                                面板内容
                            </div>
                        `, settings);
                    }
                }
                bind(`
                    <div class="popup-demo-settings">
                        弹出模式：
                        <ne-check-h-group
                            [dataProvider]="modes"
                            [(selectedItem)]="mode"
                        />
                    </div>
                    <div class="popup-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'center')">center</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'right')">right</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'left')">left</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'top')">top</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'bottom')">bottom</ne-button>
                    </div>
                    <div class="popup-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'topLeft')">topLeft</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'topRight')">topRight</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'bottomLeft')">bottomLeft</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'bottomRight')">bottomRight</ne-button>
                    </div>
                    <div class="popup-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'leftTop')">leftTop</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'rightTop')">rightTop</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'leftBottom')">leftBottom</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showPopup($event, 'rightBottom')">rightBottom</ne-button>
                    </div>
                `, {
                    requirements: [HorizontalCheckGroup],
                    container: container,
                    state: state
                })
            }
        }
    ]
})