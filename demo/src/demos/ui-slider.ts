import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, HSlider } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Input } from '../../../src/components/input/input';
import { NumberInput } from '../../../src/components/input/number';
import { SearchInput } from '../../../src/components/input/search';
import { TextArea } from '../../../src/components/input/textarea';

appendCSSTagOnce('ui-slider-demo', `
`)
register({
    title: '滑竿',
    cases: [
        {
            title: 'ne-h-slider',
            bootstrap: container => {
                bind(`
                    <ne-h-slider
                        [min]="0"
                        [max]="100"
                    >
                    </ne-h-slider>
                `, {
                    requirements: [HSlider],
                    container: container,
                })
            }
        }
    ]
})