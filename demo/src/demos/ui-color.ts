import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, HSlider, PalletePicker, ColorPickerPanel, ColorPicker } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Input } from '../../../src/components/input/input';
import { NumberInput } from '../../../src/components/input/number';
import { SearchInput } from '../../../src/components/input/search';
import { TextArea } from '../../../src/components/input/textarea';

appendCSSTagOnce('ui-color', `
`)
register({
    title: '颜色选择器',
    cases: [
        {
            title: 'ne-color-picker-panel',
            bootstrap: container => {
                bind(`
                    <ne-color-picker
                        [color]="color"
                        [mini]="true"
                        [showCommitButton]="true"
                    >
                    </ne-color-picker>
                `, {
                    requirements: [ColorPicker],
                    container: container,
                    state: {
                        color: '#ff0000'
                    }
                })
            }
        }, {
            title: 'ne-color-picker-panel',
            bootstrap: container => {
                bind(`
                    <div>完整面板（默认）</div>
                    <ne-color-picker-panel
                        [color]="color"
                    >
                    </ne-color-picker-panel>
                    <div>迷你面板（mini=true）</div>
                    <ne-color-picker-panel
                        [color]="color"
                        [mini]="true"
                    >
                    </ne-color-picker-panel>
                `, {
                    requirements: [ColorPickerPanel],
                    container: container,
                    state: {
                        color: '#ff0000'
                    }
                })
            }
        }, {
            title: 'ne-pallete-picker',
            bootstrap: container => {
                bind(`
                    <ne-pallete-picker
                        [pallete]="pallete"
                    >
                    </ne-pallete-picker>
                `, {
                    requirements: [PalletePicker],
                    container: container,
                    state: {
                        // 七彩虹
                        // pallete: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF']
                        // 三原色
                        // pallete: ['#FF0000', '#FFFF00', '#0000FF']
                        // CMYK 12色谱
                        pallete: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffff00', '#99ff00', '#00ff00', '#00ffff', '#0000ff', '#6600ff', '#ff00ff', '#ff0066']
                    }
                })
            }
        }
    ]
})