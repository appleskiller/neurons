import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { addEventListener } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { theme } from '../style/theme';
import { IChangeDetector, StateChanges } from '../../binding/common/interfaces';
import { math, isDefined, isValidDate, createDate, getDateTime, isArray } from 'neurons-utils';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { Slider } from '../slider/slider';
import { Button } from '../button/button';
import { SvgIcon } from '../icon/svgicon';
import { arrow_down, arrow_left, arrow_right, arrow_up, caret_down, date_icon } from '../icon/icons';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { DigitNumberInput } from '../input/digitnumber';
import { popupManager } from '../../cdk/popup/manager';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { IPopupButtonOption, PopupButton } from '../button/popupbutton';
import { bind } from '../../binding';

const numberNames = {0: '日', 1: '一', 2: '二',3: '三',4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二'};

@Binding({
    selector: 'ne-date-picker-panel',
    template: `
        <div class="ne-date-picker-panel"
            [readonly]="readonly ? '' : null"
            [disabled]="disabled ? '' : null"
            [class.show-commit]="showCommitButton"
            [class.range-selection]="isRangeSelection"
        >
            <div class="ne-date-picker-panel-header">
                <div class="ne-date-picker-panel-year">
                    <div class="ne-date-picker-panel-year-btn" [readonly]="dateLevel === 'year' ? '' : null" (click)="onClickYearAndMonth()">{{getViewYearAndMonth()}}</div>
                    <div class="ne-date-picker-panel-arrow-btn">
                        <ne-button [disabled]="disabled || readonly" (click)="onPrevious()"><ne-icon [icon]="arrow_up"></ne-icon></ne-button>
                        <ne-button [disabled]="disabled || readonly" (click)="onNext()"><ne-icon [icon]="arrow_down"></ne-icon></ne-button>
                    </div>
                </div>
            </div>
            <div class="ne-date-picker-panel-body" #container [class.hide-days]="!!yearPopupRef || !!monthPopupRef">
                <div class="ne-date-picker-panel-day" [style.visibility]="(dateLevel === 'date' || dateLevel=== 'datetime') ? 'visible' : 'hidden'">
                    <div class="ne-date-picker-panel-weeks">
                        <div class="ne-date-picker-panel-weeks-item" *for="week in weeks">{{getWeekName(week)}}</div>
                    </div>
                    <div class="ne-date-picker-panel-days">
                        <div class="ne-date-picker-panel-days-item"
                            *for="item in days"
                            [class.today]="item.isToday"
                            [class.current-month]="item.isCurrentMonth"
                            [class.selected]="item.isSelected"
                            [class.in-range]="item.isInRange"
                            [disabled]="item.isDisabled ? '' : null"
                            (click)="onClickDay(item)"
                            (mouseenter)="onMouseEnterDay(item)"
                        >{{item.date}}</div>
                    </div>
                    <div class="ne-date-picker-panel-times" *if="dateLevel === 'datetime' && !isRangeSelection">
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedHour" (change)="onTimeChange()" digit="2" min="0" max="23" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">时</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedMinute" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">分</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedSecend" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">秒</div>
                    </div>
                    <div class="ne-date-picker-panel-times" *if="dateLevel === 'datetime' && isRangeSelection">
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedHour" (change)="onTimeChange()" digit="2" min="0" max="23" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">:</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedMinute" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">:</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedSecend" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep"> ~ </div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedHour1" (change)="onTimeChange()" digit="2" min="0" max="23" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">:</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedMinute1" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                        <div class="ne-date-picker-panel-times-sep">:</div>
                        <ne-digit-number-input [disabled]="disabled" [readonly]="readonly" [(value)]="selectedSecend1" (change)="onTimeChange()" digit="2" min="0" max="59" focusSelectable="true"></ne-digit-number-input>
                    </div>
                </div>
            </div>
            <div *if="showCommitButton" class="ne-date-picker-panel-footer">
                <ne-button [disabled]="disabled || readonly" mode="flat" (click)="onCancel()">{{cancelLabel}}</ne-button>
                <ne-button [disabled]="isDisableCommit()" mode="flat" color="primary" (click)="onCommit()">{{okLabel}}</ne-button>
            </div>
        </div>
    `,
    style: `
        .ne-date-picker-panel {
            width: 320px;
            user-select: none;
            .ne-date-picker-panel-header {

            }
            .ne-date-picker-panel-body {
                position: relative;
                .ne-popup-panel.ne-internal-panel {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 1;
                    .ne-popup-panel-content {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                    }
                }
                &.hide-days {
                    .ne-date-picker-panel-day {
                        opacity: 0;
                    }
                }
            }
            .ne-date-picker-panel-footer {
                border-top: solid 1px ${theme.gray.normal};
                .ne-button {
                    vertical-align: top;
                    border-radius: 0;
                    padding: 8px 12px;
                    width: 50%;
                    &:first-child {
                        border-bottom-left-radius: 3px;
                    }
                    &:last-child {
                        border-bottom-right-radius: 3px;
                    }
                }
            }
            .ne-date-picker-panel-year {
                position: relative;
                width: 100%;
                padding: 6px 80px 6px 12px;
                box-sizing: border-box;
                overflow: hidden;
                border-bottom: solid 1px ${theme.gray.normal};
                .ne-date-picker-panel-year-btn {
                    padding: 6px 0;
                    cursor: pointer;
                    transition: ${theme.transition.normal('color')};
                    &:not([readonly]):hover {
                        color: ${theme.color.primary};
                    }
                    &[readonly] {
                        cursor: default;
                    }
                }
                .ne-date-picker-panel-arrow-btn {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    .ne-button {
                        padding: 6px 9px;
                    }
                }
            }
            .ne-date-picker-panel-years {
                position: relative;
                width: 100%;
                height: 100%;
                padding: 4px;
                box-sizing: border-box;
                .ne-date-picker-panel-years-item {
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    width: 25%;
                    height: 25%;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 3px;
                    outline: solid 2px transparent;
                    box-sizing: border-box;
                    transition: ${theme.transition.normal('background-color', 'outline', 'color')};
                    & > div {
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 24px;
                        margin: auto;
                    }
                    &:not([disabled]):not(.selected):not(.in-range):hover {
                        color: ${theme.color.primary};
                        background-color: ${theme.gray.normal};
                    }
                    &.selected {
                        background-color: ${theme.color.primary};
                        color: white;
                    }
                    &:not(.selected).in-range {
                        background-color: rgba(26, 115, 232, 0.2);
                        border-radius: 0;
                    }
                    &.today {
                        outline: solid 2px ${theme.gray.heavy};
                    }
                    &[disabled] {
                        opacity: 0.4;
                        cursor: default;
                    }
                }
            }
            .ne-date-picker-panel-months {
                position: relative;
                width: 100%;
                height: 100%;
                padding: 4px;
                box-sizing: border-box;
                .ne-date-picker-panel-months-item {
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    width: 33.33%;
                    height: 25%;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 3px;
                    outline: solid 2px transparent;
                    box-sizing: border-box;
                    transition: ${theme.transition.normal('background-color', 'outline', 'color')};
                    & > div {
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 24px;
                        margin: auto;
                    }
                    &:not([disabled]):not(.selected):not(.in-range):hover {
                        color: ${theme.color.primary};
                        background-color: ${theme.gray.normal};
                    }
                    &.selected {
                        background-color: ${theme.color.primary};
                        color: white;
                    }
                    &:not(.selected).in-range {
                        background-color: rgba(26, 115, 232, 0.2);
                        border-radius: 0;
                    }
                    &.today {
                        outline: solid 2px ${theme.gray.heavy};
                    }
                    &[disabled] {
                        opacity: 0.4;
                        cursor: default;
                    }
                }
            }
            .ne-date-picker-panel-day {
                position: relative;
                width: 100%;
                transition: ${theme.transition.normal('opacity')};
                .ne-date-picker-panel-weeks {
                    position: relative;
                    width: 100%;
                    .ne-date-picker-panel-weeks-item {
                        display: inline-block;
                        vertical-align: top;
                        width: 14.28%;
                        text-align: center;
                        padding: 8px 0;
                    }
                }
                .ne-date-picker-panel-days {
                    position: relative;
                    width: 100%;
                    padding: 4px;
                    box-sizing: border-box;
                    .ne-date-picker-panel-days-item {
                        display: inline-block;
                        vertical-align: top;
                        width: 14.28%;
                        text-align: center;
                        cursor: pointer;
                        padding: 8px 0;
                        border-radius: 3px;
                        outline: solid 2px transparent;
                        box-sizing: border-box;
                        transition: ${theme.transition.normal('background-color', 'outline', 'color', 'opacity')};
                        &:not([disabled]):not(.selected):not(.in-range):hover {
                            color: ${theme.color.primary};
                            background-color: ${theme.gray.normal};
                        }
                        &.selected {
                            background-color: ${theme.color.primary};
                            color: white;
                        }
                        &:not(.selected).in-range {
                            background-color: rgba(26, 115, 232, 0.2);
                            border-radius: 0;
                        }
                        &.today {
                            outline: solid 2px ${theme.gray.heavy};
                        }
                        &:not(.current-month) {
                            color: ${theme.black.light};
                        }
                        &[disabled] {
                            opacity: 0.4;
                            cursor: default;
                        }
                    }
                }
                .ne-date-picker-panel-times {
                    position: relative;
                    width: 100%;
                    border-top: solid 1px ${theme.gray.normal};
                    .ne-digit-number-input {
                        display: inline-block;
                        vertical-align: top;
                        width: 24%;
                        text-align: center;
                        padding: 8px;
                        border: none;
                        border-radius: 0;
                        &:hover {
                            background-color: ${theme.gray.light};
                        }
                        &:focus {
                            background-color: ${theme.gray.normal};
                        }
                    }
                    .ne-date-picker-panel-times-sep {
                        display: inline-block;
                        vertical-align: top;
                        width: 9%;
                        text-align: center;
                        padding: 5px 0;
                    }
                }
            }
            &[readonly] {
                .ne-date-picker-panel-year {
                    .ne-date-picker-panel-year-btn {
                        cursor: default;
                        &:hover {
                            color: inherit;
                        }
                    }
                }
                .ne-date-picker-panel-years {
                    .ne-date-picker-panel-years-item {
                        cursor: default;
                        &:not([disabled]):not(.selected):not(.in-range):hover {
                            color: inherit;
                            background-color: inherit;
                        }
                        &.selected {
                            background-color: ${theme.color.primary};
                            color: white;
                        }
                        &:not(.selected).in-range {
                            background-color: rgba(26, 115, 232, 0.2);
                            border-radius: 0;
                        }
                    }
                }
                .ne-date-picker-panel-months {
                    .ne-date-picker-panel-months-item {
                        cursor: default;
                        &:not([disabled]):not(.selected):not(.in-range):hover {
                            color: inherit;
                            background-color: inherit;
                        }
                        &.selected {
                            background-color: ${theme.color.primary};
                            color: white;
                        }
                        &:not(.selected).in-range {
                            background-color: rgba(26, 115, 232, 0.2);
                            border-radius: 0;
                        }
                    }
                }
                .ne-date-picker-panel-day {
                    .ne-date-picker-panel-days {
                        .ne-date-picker-panel-days-item {
                            cursor: default;
                            &:not([disabled]):not(.selected):not(.in-range):hover {
                                color: inherit;
                                background-color: inherit;
                            }
                            &.selected {
                                background-color: ${theme.color.primary};
                                color: white;
                            }
                            &:not(.selected).in-range {
                                background-color: rgba(26, 115, 232, 0.2);
                                border-radius: 0;
                            }
                        }
                    }
                }
            }
            &[disabled] {
                opacity: 0.4;
                .ne-date-picker-panel-year {
                    .ne-date-picker-panel-year-btn {
                        cursor: default;
                        &:hover {
                            color: inherit;
                        }
                    }
                }
                .ne-date-picker-panel-years {
                    .ne-date-picker-panel-years-item {
                        cursor: default;
                        &:not([disabled]):not(.selected):not(.in-range):hover {
                            color: inherit;
                            background-color: inherit;
                        }
                        &.selected {
                            background-color: ${theme.color.primary};
                            color: white;
                        }
                        &:not(.selected).in-range {
                            background-color: rgba(26, 115, 232, 0.2);
                            border-radius: 0;
                        }
                    }
                }
                .ne-date-picker-panel-months {
                    .ne-date-picker-panel-months-item {
                        cursor: default;
                        &:not([disabled]):not(.selected):not(.in-range):hover {
                            color: inherit;
                            background-color: inherit;
                        }
                        &.selected {
                            background-color: ${theme.color.primary};
                            color: white;
                        }
                        &:not(.selected).in-range {
                            background-color: rgba(26, 115, 232, 0.2);
                            border-radius: 0;
                        }
                    }
                }
                .ne-date-picker-panel-day {
                    .ne-date-picker-panel-days {
                        .ne-date-picker-panel-days-item {
                            cursor: default;
                            &:not([disabled]):not(.selected):not(.in-range):hover {
                                color: inherit;
                                background-color: inherit;
                            }
                            &.selected {
                                background-color: ${theme.color.primary};
                                color: white;
                            }
                            &:not(.selected).in-range {
                                background-color: rgba(26, 115, 232, 0.2);
                                border-radius: 0;
                            }
                        }
                    }
                }
            }
            &.range-selection {
                .ne-date-picker-panel-day {
                    .ne-date-picker-panel-times {
                        .ne-digit-number-input {
                            width: 13.33%;
                        }
                        .ne-date-picker-panel-times-sep {
                            width: 4%;
                        }
                    }
                }
            }
        }
    `,
    requirements: [
        Slider,
        Button,
        SvgIcon,
        DigitNumberInput,
    ]
})
export class DatePickerPanel {
    @Property() minDate: number | string | Date;
    @Property() maxDate: number | string | Date;
    @Property() viewDate: number | string | Date;
    @Property() date: number | string | Date | [number | string | Date, number | string | Date];
    @Property() dateLevel: string = 'date';
    @Property() okLabel: string = '确定';
    @Property() cancelLabel: string = '取消';

    @Property() readonly: boolean = false;
    @Property() disabled: boolean = false;
    @Property() showCommitButton: boolean = false;

    @Emitter() dateChange: IEmitter<Date | [Date, Date]>;
    @Emitter() change: IEmitter<void>;
    @Emitter() cancel: IEmitter<void>;
    @Emitter() commit: IEmitter<Date | [Date, Date]>;

    @Element('container') container: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    arrow_up = arrow_up;
    arrow_down = arrow_down;
    arrow_left = arrow_left;
    arrow_right = arrow_right;

    minTime: number = Number.NEGATIVE_INFINITY;
    maxTime: number = Number.POSITIVE_INFINITY;
    selectedTime: number;
    selectedHour: number = 0;
    selectedMinute: number = 0;
    selectedSecend: number = 0;

    selectedHour1: number = 0;
    selectedMinute1: number = 0;
    selectedSecend1: number = 0;

    isRangeSelection: boolean = false;
    rangeTimes: number[];
    selectedTimes: number[];
    selectedHours: number[] = [];
    selectedMinutes: number[] = [];
    selectedSecends: number[] = [];

    viewTime: number;
    yearPopupRef: IPopupRef<any>;
    monthPopupRef: IPopupRef<any>;

    weeks = [1, 2, 3, 4, 5, 6, 0];
    days = [];

    private _destroyed = false;

    onChanges(changes) {
        if (!changes || 'minDate' in changes) {
            const date = createDate(this.minDate);
            if (isValidDate(date)) {
                this.minTime = date.getTime();
            } else {
                this.minTime = Number.NEGATIVE_INFINITY
            }
        }
        if (!changes || 'maxDate' in changes) {
            const date = createDate(this.maxDate);
            if (isValidDate(date)) {
                this.maxTime = date.getTime();
            } else {
                this.maxTime = Number.POSITIVE_INFINITY;
            }
        }
        if (!changes || 'date' in changes  || 'dateLevel' in changes || 'minDate' in changes || 'maxDate' in changes || 'viewDate' in changes) {
            this.isRangeSelection = isArray(this.date);
            const viewDate = createDate(this.viewDate);
            let autoViewTime = null;
            if (isArray(this.date)) {
                // 多选
                const dates = [];
                dates[0] = createDate(this.date[0]);
                dates[1] = createDate(this.date[1]);
                this.selectedTimes = [];
                this.selectedHours = [];
                this.selectedMinutes = [];
                this.selectedSecends = [];
                let selectedTime = null;
                dates.forEach((date, index) => {
                    if (isValidDate(date)) {
                        selectedTime = date.getTime();
                        this.selectedTimes.push(selectedTime);
                        this.selectedHours.push(date.getHours());
                        this.selectedMinutes.push(date.getMinutes());
                        this.selectedSecends.push(date.getSeconds());
                    } else {
                        selectedTime = null;
                        this.selectedTimes.push(selectedTime);
                        this.selectedHours.push(0);
                        this.selectedMinutes.push(0);
                        this.selectedSecends.push(0);
                    }
                    if (selectedTime !== null && autoViewTime === null) {
                        autoViewTime = selectedTime;
                    }
                })
                this.selectedHour = this.selectedHours[0];
                this.selectedMinute = this.selectedMinutes[0];
                this.selectedSecend = this.selectedSecends[0];
                this.selectedHour1 = this.selectedHours[1];
                this.selectedMinute1 = this.selectedMinutes[1];
                this.selectedSecend1 = this.selectedSecends[1];
                if (this.selectedTimes.every(t => isDefined(t))) {
                    this.selectedTimes = this.selectedTimes.sort((a, b) => a - b);
                }
                this.rangeTimes = this.selectedTimes.concat();
            } else {
                // 单选
                const date = createDate(this.date);
                if (isValidDate(date)) {
                    this.selectedTime = date.getTime();
                    this.selectedHour = date.getHours();
                    this.selectedMinute = date.getMinutes();
                    this.selectedSecend = date.getSeconds();
                    autoViewTime = this.selectedTime;
                } else {
                    this.selectedTime = undefined;
                    this.selectedHour = 0;
                    this.selectedMinute = 0;
                    this.selectedSecend = 0;
                    autoViewTime = null;
                }
            }
            // view time
            if (isValidDate(viewDate)) {
                this.viewTime = viewDate.getTime()
            } else if (isDefined(autoViewTime)) {
                this.viewTime = autoViewTime;
            } else {
                autoViewTime = (new Date()).getTime();
                // 如果设置了最小日期且当前时间在最小日期之外
                if (autoViewTime < this.minTime) {
                    autoViewTime = this.minTime;
                } else if (autoViewTime > this.maxTime) {
                    autoViewTime = this.maxTime;
                }
                this.viewTime = autoViewTime;
            }
            if (this.dateLevel === 'month') {
                if (!this.yearPopupRef || !this.monthPopupRef) {
                    this.createMonthPopup(true);
                }
            } else if (this.dateLevel === 'year') {
                if (!this.yearPopupRef || !this.monthPopupRef) {
                    this.createYearPopup(true);
                }
            } else {
                // days
                this.days = this.collectDays(this.viewTime);
            }
        }
    }
    onDestroy() {
        this._destroyed = true;
        this.yearPopupRef && this.yearPopupRef.close();
        this.yearPopupRef = null;
        this.monthPopupRef && this.monthPopupRef.close();
        this.monthPopupRef = null;
    }
    onClickYearAndMonth() {
        if (this.readonly || this.disabled || this.dateLevel === 'year') return;
        if (this.yearPopupRef) {
            this.yearPopupRef.close();
            this.yearPopupRef = null;
            let autoViewTime = null;
            if (isArray(this.date)) {
                autoViewTime = this.selectedTimes.find(t => isDefined(t));
            } else {
                autoViewTime = this.selectedTime;
            }
            if (!isDefined(autoViewTime)) {
                autoViewTime = (new Date()).getTime();
                // 如果设置了最小日期且当前时间在最小日期之外
                if (autoViewTime < this.minTime) {
                    autoViewTime = this.minTime;
                } else if (autoViewTime > this.maxTime) {
                    autoViewTime = this.maxTime;
                }
            }
            this.viewTime = autoViewTime;
            if (this.dateLevel === 'month') {
                this.createMonthPopup();
            } else {
                this.days = this.collectDays(this.viewTime);
            }
        } else if (this.monthPopupRef) {
            this.monthPopupRef.close();
            this.monthPopupRef = null;
            this.createYearPopup()
        } else {
            this.createMonthPopup();
        }
    }
    onPrevious() {
        if (this.readonly || this.disabled) return;
        const date = new Date(this.viewTime);
        const today = new Date();
        const isRangeSelection = isArray(this.date);
        const selectedDate = new Date(this.selectedTime);
        const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
        const minYear = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getFullYear();
        const maxYear = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getFullYear();
        if (this.yearPopupRef) {
            const years = this.yearPopupRef.getState('years') || [];
            if (!years.length) return;
            date.setFullYear(date.getFullYear() - 16);
            this.viewTime = date.getTime();
            this.yearPopupRef.setState({
                years: years.map((item, index) => {
                    const year = item.year - 16;
                    return {
                        year: year,
                        isDisabled: year < minYear || year > maxYear,
                        isToday: today.getFullYear() === year,
                        isSelected: isRangeSelection
                            ? (selectedDates[0].getFullYear() === year || selectedDates[1].getFullYear() === year)
                            : selectedDate.getFullYear() === year,
                        isInRange: isRangeSelection
                            ? (year > selectedDates[0].getFullYear() && year < selectedDates[1].getFullYear())
                            : false
                    }
                })
            })
        } else if (this.monthPopupRef) {
            const months = this.monthPopupRef.getState('months');
            if (!months.length) return;
            date.setFullYear(date.getFullYear() - 1);
            this.viewTime = date.getTime();
            const minMonth = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getMonth();
            const maxMonth = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getMonth();
            const minTime = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(minYear, minMonth, 1, 0, 0, 0));
            const maxTime = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(maxYear, maxMonth, 1, 0, 0, 0));
            const minRangeTime = isRangeSelection ? (new Date(selectedDates[0].getFullYear(), selectedDates[0].getMonth(), 1, 0, 0, 0)).getTime() : null;
            const maxRangeTime = isRangeSelection ? (new Date(selectedDates[1].getFullYear(), selectedDates[1].getMonth(), 1, 0, 0, 0)).getTime() : null;
            this.monthPopupRef.setState({
                months: months.map(item => {
                    const time = (new Date(date.getFullYear(), item.month - 1, 1, 0, 0, 0)).getTime();
                    return {
                        ...item,
                        isDisabled: time < minTime || time > maxTime,
                        isToday: today.getFullYear() === date.getFullYear() && today.getMonth() === item.month - 1,
                        isSelected: isRangeSelection
                            ? ((selectedDates[0].getFullYear() === date.getFullYear() && selectedDates[0].getMonth() === item.month - 1) || (selectedDates[1].getFullYear() === date.getFullYear() && selectedDates[1].getMonth() === item.month - 1))
                            : selectedDate.getFullYear() === date.getFullYear() && selectedDate.getMonth() === item.month - 1,
                        isInRange: isRangeSelection
                            ? (time > minRangeTime && time < maxRangeTime)
                            : false
                    }
                })
            })
        } else {
            date.setMonth(date.getMonth() - 1);
            this.viewTime = date.getTime();
            this.days = this.collectDays(this.viewTime);
        }
    }
    onNext() {
        if (this.readonly || this.disabled) return;
        const date = new Date(this.viewTime);
        const today = new Date();
        const isRangeSelection = isArray(this.date);
        const selectedDate = new Date(this.selectedTime);
        const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
        const minYear = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getFullYear();
        const maxYear = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getFullYear();
        if (this.yearPopupRef) {
            const years = this.yearPopupRef.getState('years') || [];
            if (!years.length) return;
            date.setFullYear(date.getFullYear() + 16);
            this.viewTime = date.getTime();
            this.yearPopupRef.setState({
                years: years.map((item, index) => {
                    const year = item.year + 16;
                    return {
                        year: year,
                        isDisabled: year < minYear || year > maxYear,
                        isToday: today.getFullYear() === year,
                        isSelected: isRangeSelection
                            ? (selectedDates[0].getFullYear() === year || selectedDates[1].getFullYear() === year)
                            : selectedDate.getFullYear() === year,
                        isInRange: isRangeSelection
                            ? (year > selectedDates[0].getFullYear() && year < selectedDates[1].getFullYear())
                            : false
                    }
                })
            })
        } else if (this.monthPopupRef) {
            const months = this.monthPopupRef.getState('months');
            if (!months.length) return;
            date.setFullYear(date.getFullYear() + 1);
            this.viewTime = date.getTime();
            const minMonth = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getMonth();
            const maxMonth = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getMonth();
            const minTime = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(minYear, minMonth, 1, 0, 0, 0));
            const maxTime = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(maxYear, maxMonth, 1, 0, 0, 0));
            const minRangeTime = isRangeSelection ? (new Date(selectedDates[0].getFullYear(), selectedDates[0].getMonth(), 1, 0, 0, 0)).getTime() : null;
            const maxRangeTime = isRangeSelection ? (new Date(selectedDates[1].getFullYear(), selectedDates[1].getMonth(), 1, 0, 0, 0)).getTime() : null;
            this.monthPopupRef.setState({
                months: months.map(item => {
                    const time = (new Date(date.getFullYear(), item.month + 1, 1, 0, 0, 0)).getTime();
                    return {
                        ...item,
                        isDisabled: time < minTime || time > maxTime,
                        isToday: today.getFullYear() === date.getFullYear() && today.getMonth() === item.month + 1,
                        isSelected: isRangeSelection
                            ? ((selectedDates[0].getFullYear() === date.getFullYear() && selectedDates[0].getMonth() === item.month + 1) || (selectedDates[1].getFullYear() === date.getFullYear() && selectedDates[1].getMonth() === item.month + 1))
                            : selectedDate.getFullYear() === date.getFullYear() && selectedDate.getMonth() === item.month + 1,
                        isInRange: isRangeSelection
                            ? (time > minRangeTime && time < maxRangeTime)
                            : false
                    }
                })
            })
        } else {
            date.setMonth(date.getMonth() + 1);
            this.viewTime = date.getTime();
            this.days = this.collectDays(this.viewTime);
        }
    }
    onClickDay(item) {
        if (this.readonly || this.disabled || item.isDisabled) return;
        const isRangeSelection = isArray(this.date);
        const date = new Date(item.year, item.month, item.date, this.selectedHour, this.selectedMinute, this.selectedSecend);
        const selectedTime = date.getTime();
        if (isRangeSelection) {
            this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
            this.selectedTimes = this.rangeTimes.concat();
            this.viewTime = selectedTime;
            this.days = this.collectDays(this.viewTime);
            this.changeDate([
                isDefined(this.selectedTimes[0]) ? new Date(this.selectedTimes[0]) : null,
                isDefined(this.selectedTimes[1]) ? new Date(this.selectedTimes[1]) : null,
            ]);
        } else {
            this.days.forEach(d => {
                d.isSelected = false;
            });
            item.isSelected = true;
            if (this.selectedTime !== selectedTime) {
                this.selectedTime = selectedTime;
                this.viewTime = this.selectedTime;
                if (!item.isCurrentMonth) {
                    this.days = this.collectDays(this.viewTime);
                }
                this.changeDate(new Date(this.selectedTime));
            }
        }
    }
    onMouseEnterDay(item) {
        if (this.readonly || this.disabled || item.isDisabled) return;
        const isRangeSelection = isArray(this.date);
        if (isRangeSelection) {
            if (this.selectedTimes.filter(t => isDefined(t)).length !== 1) return;
            const date = new Date(item.year, item.month, item.date, 0, 0, 0);
            const selectedTime = date.getTime();
            this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
            // this.viewTime = selectedTime;
            // const days = this.collectDays(this.viewTime);
            const selectedDates = this.rangeTimes.map(t => new Date(t));
            this.days.forEach((d, i) => {
                const time = (new Date(d.year, d.month, d.date, 0, 0, 0)).getTime();
                Object.assign(d, {
                    isSelected: ((selectedDates[0].getFullYear() === d.year && selectedDates[0].getMonth() === d.month && selectedDates[0].getDate() === d.date) || (selectedDates[1].getFullYear() === d.year && selectedDates[1].getMonth() === d.month && selectedDates[1].getDate() === d.date)),
                    isInRange: (time > this.rangeTimes[0] && time < this.rangeTimes[1])
                });
            })
        }
    }
    onTimeChange() {
        if (this.readonly || this.disabled) return;
        const isRangeSelection = isArray(this.date);
        if (isRangeSelection) {
            this.selectedHours = [this.selectedHour, this.selectedHour1];
            this.selectedMinutes = [this.selectedMinute, this.selectedMinute1];
            this.selectedSecends = [this.selectedSecend, this.selectedSecend1];
            const selectedDates = this.selectedTimes.map((t, index) => {
                if (isDefined(t)) {
                    const date = new Date(t);
                    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.selectedHours[index], this.selectedMinutes[index], this.selectedSecends[index]);
                }
                return null;
            });
            this.selectedTimes = selectedDates.map(d => isDefined(d) ? d.getTime() : null);
            this.changeDate(selectedDates);
        } else {
            const date = new Date(this.selectedTime);
            date.setHours(this.selectedHour);
            date.setMinutes(this.selectedMinute);
            date.setSeconds(this.selectedSecend);
            this.selectedTime = date.getTime();
            this.changeDate(date);
        }
    }
    onCancel() {
        if (this.readonly || this.disabled) return;
        this.cancel.emit();
    }
    onCommit() {
        if (this.readonly || this.disabled) return;
        const isRangeSelection = isArray(this.date);
        if (isRangeSelection) {
            this.commit.emit(this.selectedTimes.map(t => isDefined(t) ? new Date(t) : null) as [Date, Date]);
        } else {
            this.commit.emit(new Date(this.selectedTime));
        }
    }
    isDisableCommit() {
        if (this.readonly || this.disabled) return true;
        const isRangeSelection = isArray(this.date);
        if (isRangeSelection) {
            return this.selectedTimes.some(t => !isDefined(t));
        } else {
            return !isDefined(this.selectedTime);
        }
    }
    getWeekName(week) {
        return `${numberNames[week]}`;
    }
    getViewYearAndMonth() {
        if (!this.viewTime) return '';
        const date = new Date(this.viewTime);
        const year = date.getFullYear();
        const month = date.getMonth();
        if (this.yearPopupRef) {
            const index = year % 16;
            const y = year - index;
            return `${y} - ${y + 16 - 1}`;
        } else if (this.monthPopupRef) {
            return `${year}年`;
        } else {
            return `${year}年${month + 1}月`;
        }
    }
    getViewYear() {
        if (!this.viewTime) return '';
        const date = new Date(this.viewTime);
        const year = date.getFullYear();
        return `${year}年`;
    }
    getViewMonth() {
        if (!this.viewTime) return '';
        const date = new Date(this.viewTime);
        const month = date.getMonth();
        return `${month + 1}月`;
    }
    protected setTimeToRange(times: number[], time: number) {
        times = times.concat();
        let reSelection = true;
        for (let i = 0; i < times.length; i++) {
            if (!isDefined(times[i])) {
                reSelection = false;
                times[i] = time;
                break;
            }
        }
        if (reSelection) {
            times = [time, null];
        }
        if (times.every(t => isDefined(t))) {
            times = times.sort((a, b) => a - b);
        }
        const selectedDates = times.map((t, index) => {
            if (isDefined(t)) {
                const date = new Date(t);
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.selectedHours[index], this.selectedMinutes[index], this.selectedSecends[index]);
            }
            return null;
        });
        return [
            !!selectedDates[0] ? selectedDates[0].getTime() : null,
            !!selectedDates[1] ? selectedDates[1].getTime() : null,
        ]
    }
    protected changeDate(date) {
        this.date = date;
        this.dateChange.emit(this.date as Date);
        this.change.emit();
    }
    protected createMonthPopup(disableAnimation = false) {
        this.monthPopupRef && this.monthPopupRef.close();
        const state = {
            months: this.collectMonths(this.viewTime),
            onClickMonth: (item) => {
                if (this.readonly || this.disabled || item.isDisabled) return;
                if (this.dateLevel === 'month') {
                    const isRangeSelection = isArray(this.date);
                    const date = new Date(item.year, item.month, 1, 0, 0, 0);
                    const selectedTime = date.getTime();
                    if (isRangeSelection) {
                        this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
                        this.selectedTimes = this.rangeTimes.concat();
                        this.viewTime = selectedTime;
                        state.months = this.collectMonths(this.viewTime);
                        this.changeDate([
                            isDefined(this.selectedTimes[0]) ? new Date(this.selectedTimes[0]) : null,
                            isDefined(this.selectedTimes[1]) ? new Date(this.selectedTimes[1]) : null,
                        ]);
                    } else {
                        state.months.forEach(m => {
                            m.isSelected = false;
                        });
                        item.isSelected = true;
                        if (this.selectedTime !== selectedTime) {
                            this.selectedTime = selectedTime;
                            this.viewTime = this.selectedTime;
                            this.changeDate(new Date(this.selectedTime));
                        }
                    }
                } else {
                    this.monthPopupRef && this.monthPopupRef.close();
                    this.monthPopupRef = null;
                    const date = new Date(this.viewTime);
                    date.setMonth(item.month);
                    this.viewTime = date.getTime();
                    this.days = this.collectDays(this.viewTime);
                }
                this.cdr.detectChanges();
            },
            onMouseEnterMonth: item => {
                if (this.readonly || this.disabled || item.isDisabled) return;
                const isRangeSelection = isArray(this.date);
                if (isRangeSelection) {
                    if (this.selectedTimes.filter(t => isDefined(t)).length !== 1) return;
                    const date = new Date(item.year, item.month, 1, 0, 0, 0);
                    const selectedTime = date.getTime();
                    this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
                    const selectedDates = this.rangeTimes.map(t => new Date(t));
                    const minRangeTime = (new Date(selectedDates[0].getFullYear(), selectedDates[0].getMonth(), 1, 0, 0, 0)).getTime();
                    const maxRangeTime = (new Date(selectedDates[1].getFullYear(), selectedDates[1].getMonth(), 1, 0, 0, 0)).getTime();
                    state.months.forEach((m, i) => {
                        const time = (new Date(m.year, m.month, 1, 0, 0, 0)).getTime();
                        Object.assign(m, {
                            isSelected: ((selectedDates[0].getFullYear() === m.year && selectedDates[0].getMonth() === m.month) || (selectedDates[1].getFullYear() === date.getFullYear() && selectedDates[1].getMonth() === m.month)),
                            isInRange: (time > minRangeTime && time < maxRangeTime)
                        });
                    })
                }
            }
        }
        this.monthPopupRef = popupManager.open(`
            <div class="ne-date-picker-panel-months">
                <div class="ne-date-picker-panel-months-item"
                    *for="item in months"
                    [class.today]="item.isToday"
                    [class.selected]="item.isSelected"
                    [class.in-range]="item.isInRange"
                    [disabled]="item.isDisabled ? '' : null"
                    (click)="onClickMonth(item)"
                    (mouseenter)="onMouseEnterMonth(item)"
                ><div>{{item.label}}</div></div>
            </div>
        `, {
            popupContainer: this.container,
            popupMode: 'modal',
            hasOverlay: false,
            disableAnimation: disableAnimation,
            state: state
        })
    }
    protected collectMonths(time: number) {
        const date = new Date(time);
        const year = date.getFullYear();
        const today = new Date();
        const isRangeSelection = isArray(this.date);
        const selectedDate = new Date(this.selectedTime);
        const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
        const minYear = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getFullYear();
        const maxYear = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getFullYear();
        const minMonth = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getMonth();
        const maxMonth = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getMonth();
        const minTime = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(minYear, minMonth, 1, 0, 0, 0));
        const maxTime = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(maxYear, maxMonth, 1, 0, 0, 0));
        const minRangeTime = isRangeSelection ? (new Date(selectedDates[0].getFullYear(), selectedDates[0].getMonth(), 1, 0, 0, 0)).getTime() : null;
        const maxRangeTime = isRangeSelection ? (new Date(selectedDates[1].getFullYear(), selectedDates[1].getMonth(), 1, 0, 0, 0)).getTime() : null;
        // 3 * 4
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
            const time = (new Date(year, m - 1, 1, 0, 0, 0)).getTime();
            return {
                year: year,
                month: m - 1,
                label: `${m}月`,
                isDisabled: time < minTime || time > maxTime,
                isToday: today.getFullYear() === year && today.getMonth() === m - 1,
                isSelected: isRangeSelection
                    ? ((selectedDates[0].getFullYear() === year && selectedDates[0].getMonth() === m - 1) || (selectedDates[1].getFullYear() === year && selectedDates[1].getMonth() === m - 1))
                    : selectedDate.getFullYear() === year && selectedDate.getMonth() === m - 1,
                isInRange: isRangeSelection
                    ? (time > minRangeTime && time < maxRangeTime)
                    : false
            }
        })
    }
    protected createYearPopup(disableAnimation = false) {
        this.yearPopupRef && this.yearPopupRef.close();
        // const isRangeSelection = isArray(this.date);
        // const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
        const years = this.collectYears(this.viewTime);
        const state = {
            years: years,
            onClickYear: item => {
                if (this.readonly || this.disabled || item.isDisabled) return;
                if (this.dateLevel === 'year') {
                    const isRangeSelection = isArray(this.date);
                    const date = new Date(item.year, 0, 1, 0, 0, 0);
                    const selectedTime = date.getTime();
                    if (isRangeSelection) {
                        this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
                        this.selectedTimes = this.rangeTimes.concat();
                        this.viewTime = selectedTime;
                        state.years = this.collectYears(this.viewTime);
                        this.changeDate([
                            isDefined(this.selectedTimes[0]) ? new Date(this.selectedTimes[0]) : null,
                            isDefined(this.selectedTimes[1]) ? new Date(this.selectedTimes[1]) : null,
                        ]);
                    } else {
                        state.years.forEach(y => {
                            y.isSelected = false;
                        });
                        item.isSelected = true;
                        if (this.selectedTime !== selectedTime) {
                            this.selectedTime = selectedTime;
                            this.viewTime = this.selectedTime;
                            this.changeDate(new Date(this.selectedTime));
                        }
                    }
                } else {
                    this.yearPopupRef && this.yearPopupRef.close();
                    this.yearPopupRef = null;
                    const date = new Date(this.viewTime);
                    date.setFullYear(item.year);
                    this.viewTime = date.getTime();
                    this.createMonthPopup();
                }
                this.cdr.detectChanges();
            },
            onMouseEnterYear: item => {
                if (this.readonly || this.disabled || item.isDisabled) return;
                const isRangeSelection = isArray(this.date);
                if (isRangeSelection) {
                    if (this.selectedTimes.filter(t => isDefined(t)).length !== 1) return;
                    const date = new Date(item.year, 0, 1, 0, 0, 0);
                    const selectedTime = date.getTime();
                    this.rangeTimes = this.setTimeToRange(this.selectedTimes, selectedTime);
                    const selectedDates = this.rangeTimes.map(t => new Date(t));
                    state.years.forEach((y, i) => {
                        Object.assign(y, {
                            isSelected: (selectedDates[0].getFullYear() === y.year || selectedDates[1].getFullYear() === y.year),
                            isInRange: (y.year > selectedDates[0].getFullYear() && y.year < selectedDates[1].getFullYear())
                        });
                    })
                }
            }
        }
        this.yearPopupRef = popupManager.open(`
            <div class="ne-date-picker-panel-years">
                <div class="ne-date-picker-panel-years-item"
                    *for="item in years"
                    [class.today]="item.isToday"
                    [class.selected]="item.isSelected"
                    [class.in-range]="item.isInRange"
                    [disabled]="item.isDisabled ? '' : null"
                    (click)="onClickYear(item)"
                    (mouseenter)="onMouseEnterYear(item)"
                ><div>{{item.year}}</div></div>
            </div>
        `, {
            popupContainer: this.container,
            popupMode: 'modal',
            hasOverlay: false,
            disableAnimation: disableAnimation,
            state: state
        });
    }
    protected collectYears(time: number) {
        // 4 * 4
        const date = new Date(time);
        const today = new Date();
        const isRangeSelection = isArray(this.date);
        const selectedDate = new Date(this.selectedTime);
        const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
        const year = date.getFullYear();
        const arr = [];
        const index = year % 16;
        const y = year - index;
        const minYear = this.minTime === Number.NEGATIVE_INFINITY ? Number.NEGATIVE_INFINITY : (new Date(this.minTime)).getFullYear();
        const maxYear = this.maxTime === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : (new Date(this.maxTime)).getFullYear();
        for (let i = 0; i < 16; i++) {
            const time = (new Date(y + i, 0, 1, 0, 0, 0)).getTime();
            arr.push({
                year: y + i,
                isDisabled: y + i < minYear || y + i > maxYear,
                isToday: today.getFullYear() === y + i,
                isSelected: isRangeSelection
                    ? (selectedDates[0].getFullYear() === y + i || selectedDates[1].getFullYear() === y + i)
                    : selectedDate.getFullYear() === y + i,
                isInRange: isRangeSelection
                    ? (y + i > selectedDates[0].getFullYear() && y + i < selectedDates[1].getFullYear())
                    : false
            });
        }
        return arr;
    }
    protected collectDays(time: number) {
        const date = new Date(time);
        const today = new Date();
        const isRangeSelection = isArray(this.date);
        const selectedDate = new Date(this.selectedTime);
        const selectedDates = isRangeSelection ? this.rangeTimes.map(t => new Date(t)) : [];
            // return date.getDate() === item.date;
        const year = date.getFullYear();
        const month = date.getMonth();
        const count = (new Date(year, month + 1, 0)).getDate();
        const days = [];
        // 收集当前月全部天数
        for (let i = 0; i < count; i++) {
            const time = (new Date(year, month, i + 1, 0, 0, 0)).getTime();
            days.push({
                date: i + 1,
                year: year,
                month: month,
                isDisabled: time < this.minTime || time > this.maxTime,
                isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === i + 1,
                isCurrentMonth: true,
                isSelected: isRangeSelection
                    ? ((selectedDates[0].getFullYear() === year && selectedDates[0].getMonth() === month && selectedDates[0].getDate() === i + 1) || (selectedDates[1].getFullYear() === year && selectedDates[1].getMonth() === month && selectedDates[1].getDate() === i + 1))
                    : selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === i + 1,
                isInRange: isRangeSelection
                    ? (time > this.rangeTimes[0] && time < this.rangeTimes[1])
                    : false
            });
        }
        // 补充上个月天数
        const week = (new Date(year, month, 1)).getDay();
        const previousCount = (new Date(year, month, 0)).getDate();
        const previousDate = new Date(year, month - 1, previousCount);
        for (let j = 0; j < week - 1; j++) {
            const time = (new Date(previousDate.getFullYear(), previousDate.getMonth(), previousCount - j, 0, 0, 0)).getTime();
            days.unshift({
                date: previousCount - j,
                year: previousDate.getFullYear(),
                month: previousDate.getMonth(),
                isDisabled: time < this.minTime || time > this.maxTime,
                isToday: false,
                isCurrentMonth: false,
                isSelected: isRangeSelection
                    ? ((selectedDates[0].getFullYear() === previousDate.getFullYear() && selectedDates[0].getMonth() === previousDate.getMonth() && selectedDates[0].getDate() === previousCount - j) || (selectedDates[1].getFullYear() === previousDate.getFullYear() && selectedDates[1].getMonth() === previousDate.getMonth() && selectedDates[1].getDate() === previousCount - j))
                    : selectedDate.getFullYear() === previousDate.getFullYear() && selectedDate.getMonth() === previousDate.getMonth() && selectedDate.getDate() === previousCount - j,
                isInRange: isRangeSelection
                    ? (time > this.rangeTimes[0] && time < this.rangeTimes[1])
                    : false
            });
        }
        // 补充下个月天数
        const len = 42 - days.length;
        const nextDate = new Date(year, month + 1, 1);
        for (let k = 0; k < len; k++) {
            const time = (new Date(nextDate.getFullYear(), nextDate.getMonth(), k + 1, 0, 0, 0)).getTime();
            days.push({
                date: k + 1,
                year: nextDate.getFullYear(),
                month: nextDate.getMonth(),
                isDisabled: time < this.minTime || time > this.maxTime,
                isToday: false,
                isCurrentMonth: false,
                isSelected: isRangeSelection
                    ? ((selectedDates[0].getFullYear() === nextDate.getFullYear() && selectedDates[0].getMonth() === nextDate.getMonth() && selectedDates[0].getDate() === k + 1) || (selectedDates[1].getFullYear() === nextDate.getFullYear() && selectedDates[1].getMonth() === nextDate.getMonth() && selectedDates[1].getDate() === k + 1))
                    : selectedDate.getFullYear() === nextDate.getFullYear() && selectedDate.getMonth() === nextDate.getMonth() && selectedDate.getDate() === k + 1,
                isInRange: isRangeSelection
                    ? (time > this.rangeTimes[0] && time < this.rangeTimes[1])
                    : false
            });
        }
        return days;
    }
}

@Binding({
    selector: 'ne-date-picker',
    template: `
        <ne-popup-button class="ne-date-picker"
            [readonly]="readonly"
            [disabled]="disabled"
            [invalid]="invalid"
            [color]="color"
            [mode]="mode"
            [caretPosition]="caretPosition"
            [caretIcon]="caretIcon"
            [hideLabel]="hideLabel"
            [label]="label"
            [placeholder]="placeholder"
            [popupOption]="_popupOption"
            [openFunction]="openFunction"

            (opened)="onOpened()"
            (closed)="onClosed()"
        ></ne-popup-button>
    `,
    style: `
        .ne-date-picker {
        }
    `,
    requirements: [
        PopupButton,
        DatePickerPanel,
    ]
})
export class DatePicker {
    @Property() minDate: number | string | Date;
    @Property() maxDate: number | string | Date;
    @Property() date: number | string | Date | [number | string | Date, number | string | Date];
    @Property() viewDate: number | string | Date;
    @Property() format: string;
    @Property() dateLevel: string = 'date';
    @Property() okLabel: string = '确定';
    @Property() cancelLabel: string = '取消';
    
    @Property() readonly: boolean = false;
    @Property() disabled: boolean = false;
    @Property() showCommitButton: boolean = false;
    
    @Property() color: 'basic' | 'primary' = 'basic';
    @Property() mode: 'basic' | 'raised' | 'stroked' | 'flat' | 'simulated' = 'basic';
    
    @Property() caretPosition: 'before' | 'after' = 'after';
    @Property() caretIcon = date_icon;
    @Property() invalid: boolean = false;
    @Property() hideLabel: boolean = false;
    @Property() label = '';
    @Property() placeholder: string = '请选择...';

    @Property() popupOption: IPopupButtonOption;

    @Emitter() dateChange: IEmitter<Date>;
    @Emitter() change: IEmitter<void>;
    @Emitter() cancel: IEmitter<void>;
    @Emitter() commit: IEmitter<Date>;

    @Emitter() opened: IEmitter<void>;
    @Emitter() closed: IEmitter<void>;

    @Element('container') container: HTMLElement;

    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    _popupOption: IPopupButtonOption;
    openFunction = this._openFunction.bind(this);

    onChanges(changes) {
        if (!changes || 'popupOption' in changes) {
            const popupOption = this.popupOption || {};
            this._popupOption = {
                ...popupOption,
                popupMode: popupOption.popupMode || 'dropdown',
                position: popupOption.position || 'bottomLeft',
                width: popupOption.width || 320,
            }
        }
        if (!changes || 'date' in changes || 'format' in changes) {
            this.label = this.getLabel(this.date);
        }
    }
    onDestroy() {
        
    }

    onOpened() {
        this.opened.emit();
    }
    onClosed() {
        this.closed.emit();
    }
    _openFunction(container: HTMLElement, popupRef: IPopupRef<any>) {
        const state = {
            minDate: this.minDate,
            maxDate: this.maxDate,
            viewDate: this.viewDate,
            date: this.date,
            dateLevel: this.dateLevel,
            okLabel: this.okLabel,
            cancelLabel: this.cancelLabel,
            readonly: this.readonly,
            disabled: this.disabled,
            showCommitButton: this.showCommitButton,
            onChange: () => {
                if (this.showCommitButton) return;
                if (this.date !== state.date) {
                    this.date = state.date;
                    this.label = this.getLabel(this.date);
                    this.dateChange.emit(this.date as Date);
                    this.change.emit();
                    this.cdr.detectChanges();
                }
            },
            onCancel: () => {
                popupRef.close();
            },
            onCommit: (date) => {
                if (this.date !== state.date) {
                    this.date = state.date;
                    this.label = this.getLabel(this.date);
                    this.dateChange.emit(this.date as Date);
                    this.change.emit();
                    this.cdr.detectChanges();
                }
                this.commit.emit(date);
                popupRef.close();
            },
        }
        return bind(`
            <ne-date-picker-panel
                [minDate]="minDate"
                [maxDate]="maxDate"
                [viewDate]="viewDate"
                [(date)]="date"
                [dateLevel]="dateLevel"
                [okLabel]="okLabel"
                [cancelLabel]="cancelLabel"
                [readonly]="readonly"
                [disabled]="disabled"
                [showCommitButton]="showCommitButton"
                (change)="onChange()"
                (cancel)="onCancel()"
                (commit)="onCommit($event)"
            ></ne-date-picker-panel>
        `, {
            container: container,
            state: state
        })
    }
    protected getLabel(date: number | string | Date | [number | string | Date, number | string | Date]) {
        if (isArray(date)) {
            const dates: [number | string | Date, number | string | Date] = date as [number | string | Date, number | string | Date];
            dates[0] = createDate(dates[0]);
            dates[1] = createDate(dates[1]);
            return dates.map((date: Date, index) => {
                if (isValidDate(date)) {
                    const format = this.format || (this.dateLevel === 'datetime' ? 'yyyy/MM/dd hh:mm:ss' : 'yyyy/MM/dd');
                    return this.formatDate(date, format);
                } else {
                    return index ? '结束日期' : '起始日期';
                }
            }).join(' 至 ');
        } else {
            date = createDate(date);
            if (isValidDate(date)) {
                const format = this.format || (this.dateLevel === 'datetime' ? 'yyyy/MM/dd hh:mm:ss' : 'yyyy/MM/dd');
                return this.formatDate(date, format);
            } else {
                return '';
            }
        }
    }
    private formatDate(value: number | string | Date, format: string) {
        if (!isDefined(value)) {
            return ''
        }
        const time = getDateTime(value);
        if (isNaN(time)) {
            return ''
        }
        let result = format;
        const d = new Date(time);
        const week = d.getDay();
        const o: any = {
            'M+': d.getMonth() + 1,
            'Q+': 'Q' + (Math.floor(d.getMonth() / 3) + 1),
            'e+': (week === 0) ? 7 : week,
            'E+': numberNames[week],
            'd+': d.getDate(),
            'h+': d.getHours(),
            'm+': d.getMinutes(),
            's+': d.getSeconds(),
            'q+': Math.floor((d.getMonth() + 3) / 3),
            'S': d.getMilliseconds()
        };
        if (/(y+)/.test(result)) result = result.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
        for (const k in o) {
            if (new RegExp('(' + k + ')').test(result)) {
                result = result.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(-RegExp.$1.length)));
            }
        }
        return result;
    }
}

