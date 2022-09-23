import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, HSlider, PalletePicker, ColorPickerPanel, ColorPicker } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Input } from '../../../src/components/input/input';
import { NumberInput } from '../../../src/components/input/number';
import { SearchInput } from '../../../src/components/input/search';
import { DatePicker, DatePickerPanel } from '../../../src/components/date/datepicker';

appendCSSTagOnce('ui-date', `
`)
register({
    title: '日期选择器',
    cases: [
        {
            title: 'ne-date-picker',
            bootstrap: container => {
                const today = new Date();
                const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
                const maxDate = new Date(today.getFullYear() + 100, today.getMonth(), today.getDate() + 12);
                const viewDate = '2022/8/17';
                const state = {
                    date: [new Date(), new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)],
                    minDate: minDate,
                    maxDate: maxDate,
                    // viewDate: viewDate,
                    onChange: () => {
                        // console.log(state.date.toLocaleDateString(), state.date.toLocaleTimeString());
                    }
                };
                bind(`
                    <ne-date-picker
                        [(date)]="date"
                        [minDate]="minDate"
                        [maxDate]="maxDate"
                        [viewDate]="viewDate"
                        [dateLevel]="'datetime'"
                        [caretPosition]="'after'"
                        [showCommitButton]="false"
                        (change)="onChange()"
                    >
                    </ne-date-picker>
                `, {
                    requirements: [DatePicker],
                    container: container,
                    state: state
                })
            }
        }, {
            title: 'ne-date-picker-panel',
            bootstrap: container => {
                const today = new Date();
                const state = {
                    // date: new Date(),
                    date: [new Date(), new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)],
                    onChange: () => {
                        
                    }
                };
                bind(`
                    <ne-date-picker-panel
                        [(date)]="date"
                        dateLevel="year"
                        showCommitButton="true"
                        (change)="onChange()"
                    >
                    </ne-date-picker-panel>
                `, {
                    requirements: [DatePickerPanel],
                    container: container,
                    state: state
                })
            }
        }
    ]
})