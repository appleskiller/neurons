import { IElementRef, IBindingRef } from '../../binding/common/interfaces';
import { IModalOption, modal } from '../dialog';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { createElement, appendCSSTagOnce } from 'neurons-dom';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { bind } from '../../binding';
import { theme } from '../style/theme';
import { arrow_right } from '../icon/icons';
import '../icon/svgicon';

export interface IAccordionStepperControl {
    step: IAccordionStep;
    stepIndex: number;
    stepCount: number;
    stepVisited: boolean;

    forward(data?: any): void;
    back(data?: any): void;
    jump(index, data?: any): void;
    active(index, active: boolean): void;
    resize(): void;
    destroy(): void;

    onCompleted: IEmitter<any>;

    [key: string]: any;
}

export interface IStepperAccordionOption {
    container: HTMLElement;
}

export interface IAccordionStep {
    stepName?: string;
    stepDescription?: string;
    template: string;
    state: any;

    // [key: string]: any;
}

export interface IAccordionStepControl {
    index: number;
    touched: boolean;
    actived: boolean;

    forward(data?: any): void;
    back(data?: any): void;
    jump(index, data?: any): void;
    active(active: boolean): void;
    resize(): void;
}

export const STEPPER_TOKENS = {
    STEP_CONTROLLER: 'STEP_CONTROL',
    CONTROLLER: 'CONTROLLER',
}

function bindTitleRef(step: IAccordionStep, index: number, container: HTMLElement, stepControl: IAccordionStepControl, stepperControl: IAccordionStepperControl): IBindingRef<any> {
    return bind(`
        <div class="ne-accordion-stepper-title"
            (click)="onClick()"
            [class.touched]="touched"
            [class.actived]="actived"
            [step-index]="index"
        >
            <div class="ne-accordion-stepper-title-name">{{step.stepName}}</div>
            <div class="ne-accordion-stepper-title-description">{{step.stepDescription}}</div>
            <ne-icon class="ne-accordion-stepper-title-icon" [icon]="icon"></ne-icon>
        </div>
    `, {
        container: container,
        state: {
            step: step,
            index: index,
            touched: false,
            actived: false,
            icon: arrow_right,
            onClick: () => {
                stepControl.active(!stepControl.actived);
            }
        },
        providers: [{
            token: STEPPER_TOKENS.CONTROLLER,
            use: stepperControl
        }, {
            token: STEPPER_TOKENS.STEP_CONTROLLER,
            use: stepControl
        }]
    })
}

function bindContentRef(step: IAccordionStep, index: number, container: HTMLElement, stepControl: IAccordionStepControl, stepperControl: IAccordionStepperControl): IBindingRef<any> {
    let ref: IBindingRef<any>, wrapperRef: IBindingRef<any>;
    const state = {
        height: 0,
        maxHeight: 0,
        index: index,
        touched: false,
        actived: false,
        onChanges: (changes) => {
            if (!ref && state.touched && state.actived) {
                ref = bind(step.template || '', {
                    container: wrapperRef.element('content') as HTMLElement,
                    state: step.state,
                    providers: [{
                        token: STEPPER_TOKENS.CONTROLLER,
                        use: stepperControl
                    }, {
                        token: STEPPER_TOKENS.STEP_CONTROLLER,
                        use: stepControl
                    }]
                });
            }
            if (!changes || 'actived' in changes) {
                if (ref) {
                    state.actived ? ref.attach() : ref.detach();
                }
            }
            if (!changes || 'actived' in changes || 'maxHeight' in changes) {
                if (ref) {
                    state.onResize();
                }
            }
        },
        onDestroy: () => {
            ref && ref.destroy();
        },
        onResize: () => {
            if (state.maxHeight) {
                if (ref && state.actived) {
                    const content = wrapperRef.element('content') as HTMLElement;
                    content.style.height = state.maxHeight + 'px';
                    ref.resize();
                    const box = ref.getBoundingClientRect();
                    const height = Math.min(box.height, state.maxHeight);
                    wrapperRef.setState({height: height});
                    content.style.height = height + 'px';
                    ref.resize();
                } else {
                    wrapperRef.setState({height: 0});
                }
            }
        }
    }
    wrapperRef = bind(`
        <div class="ne-accordion-stepper-content"
            [class.touched]="touched"
            [class.actived]="actived"
            [step-index]="index"
            [style.height]="height"
            [style.max-height]="maxHeight"
        >
            <div class="ne-accordion-stepper-content-layout" #content/>
        </div>
    `, {
        container: container,
        state: state,
    })
    return wrapperRef;
}

export function stepperAccordion(option: IStepperAccordionOption, steps: IAccordionStep[], initialData?: any): IAccordionStepperControl {
    let initeds = [], datas = [], stepControls: IAccordionStepControl[] = [], titleRefs: IBindingRef<any>[] = [], contentRefs: IBindingRef<any>[] = [];
    const _nativeEmitter = new EventEmitter();
    let isCompleted = false;
    const complete = () => {
        isCompleted = true;
    }
    const controller: IAccordionStepperControl = {
        previousIndex: -1,
        stepIndex: -1,
        stepCount: steps.length,
        stepVisited: false,
        step: null,

        onCompleted: emitter('completed', _nativeEmitter),

        forward: function (data?: any) {
            if (controller.stepIndex >= controller.stepCount - 1) {
                controller.onCompleted.emit(data);
                complete();
            } else {
                controller.previousIndex = controller.stepIndex;
                controller.stepIndex += 1;

                datas[controller.stepIndex] = arguments.length ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];
                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep);
                        controller.stepVisited = false;
                    }
                    controller.stepVisited = true;
                    controller.active(controller.stepIndex, true);
                } else {
                    controller.forward(data);
                }
            }
        },
        back: function (data?: any) {
            if (controller.stepIndex > 0){
                controller.previousIndex = controller.stepIndex;
                controller.stepIndex -= 1;

                datas[controller.stepIndex] = arguments.length ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];
                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep);
                        controller.stepVisited = false;
                    }
                    controller.stepVisited = true;
                    controller.active(controller.stepIndex, true);
                } else {
                    controller.back(data);
                }
            }
        },
        jump: function (index, data?: any) {
            if (controller.stepIndex !== index && index >= 0 && index < controller.stepCount) {
                controller.previousIndex = controller.stepIndex;
                controller.stepIndex = index;

                datas[controller.stepIndex] = arguments.length >= 2 ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];

                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep)
                        controller.stepVisited = false;
                    }
                    controller.stepVisited = true;
                    controller.active(controller.stepIndex, true);
                }
            }
        },
        active: function(index, active: boolean) {
            if (controller.stepIndex === index && stepControls[index] && stepControls[index].actived === active) return;
            if (controller.stepIndex !== index) {
                active && controller.jump(index);
                return;
            }
            stepControls.forEach((control, i) => {
                if (i !== index) {
                    control && (control.actived = false);
                    titleRefs[i] && titleRefs[i].setState({
                        actived: false
                    });
                    contentRefs[i] && contentRefs[i].setState({
                        actived: false,
                    });
                }
            })
            stepControls[index] && (stepControls[index].actived = !!active);
            if (titleRefs[index]) {
                if (active) {
                    titleRefs[index].setState({
                        touched: true,
                        actived: true,
                    });
                } else {
                    titleRefs[index].setState({
                        actived: false,
                    });
                }
            }
            if (contentRefs[index]) {
                if (active) {
                    contentRefs[index].setState({
                        touched: true,
                        actived: true,
                    });
                } else {
                    contentRefs[index].setState({
                        actived: false,
                    });
                }
            }
        },
        resize: function() {
            stepControls.forEach((control, index) => {
                contentRefs[index] && contentRefs[index].resize();
            })
        },
        destroy: function() {
            _nativeEmitter.off();
            titleRefs.forEach(ref => ref.destroy());
            contentRefs.forEach(ref => ref.destroy());
        }
    }
    // 创建视图
    const container = createElement('div', 'ne-accordion-stepper');
    option.container.appendChild(container);
    let maxHeight = 0;
    steps.forEach((step, index) => {
        const control: IAccordionStepControl = {
            index: index,
            touched: false,
            actived: false,

            forward: function(data?: any) { controller.forward(data); },
            back: function(data?: any) { controller.back(data); },
            jump: function(index, data?: any) { controller.jump(index, data); },
            active: function(active: boolean) { controller.active(index, active); },
            resize: function() { controller.resize(); },
        };
        const titleRef = bindTitleRef(step, index, container, control, controller);
        // 计算content最大高度
        if (!maxHeight) {
            const containerBox = container.getBoundingClientRect();
            const titleBox = titleRef.getBoundingClientRect();
            maxHeight = Math.floor(containerBox.height - titleBox.height * steps.length);
        }
        const contentRef = bindContentRef(step, index, container, control, controller);
        contentRef.setState({
            height: 0,
            maxHeight: maxHeight,
        });
        stepControls.push(control);
        titleRefs.push(titleRef);
        contentRefs.push(contentRef);
    })
    controller.forward(initialData);
    return controller;
}

appendCSSTagOnce('ne-accordion-stepper', `
.ne-accordion-stepper {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
}
.ne-accordion-stepper .ne-accordion-stepper-title {
    line-height: 36px;
    position: relative;
    width: 100%;
    padding: 0 24px;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    transition: ${theme.transition.normal('background-color')};
    overflow: hidden;
}
.ne-accordion-stepper .ne-accordion-stepper-title:hover {
    background-color: ${theme.gray.normal};
}
.ne-accordion-stepper .ne-accordion-stepper-title.actived {
    background-color: ${theme.gray.normal};
}
.ne-accordion-stepper .ne-accordion-stepper-title .ne-accordion-stepper-title-name {
    display: inline-block;
    width: 100%;
    box-sizing: border-box;
    padding-right: 300px;
    font-weight: bold;
}
.ne-accordion-stepper .ne-accordion-stepper-title .ne-accordion-stepper-title-description {
    position: absolute;
    right: 42px;
    top: 0;
    display: inline-block;
    font-size: 13px;
    color: ${theme.black.light};
}
.ne-accordion-stepper .ne-accordion-stepper-title .ne-accordion-stepper-title-icon {
    position: absolute;
    right: 6px;
    top: 0;
    width: 36px;
    transition: ${theme.transition.normal('transform')};
}
.ne-accordion-stepper .ne-accordion-stepper-title.actived .ne-accordion-stepper-title-icon {
    transform: rotateZ(90deg);
}
.ne-accordion-stepper .ne-accordion-stepper-content {
    position: relative;
    border-bottom: solid 1px ${theme.gray.heavy};
    box-sizing: border-box;
    overflow: hidden;
    transition: ${theme.transition.normal('height')};
}
.ne-accordion-stepper .ne-accordion-stepper-content .ne-accordion-stepper-content-layout {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    opacity: 0;
    transition: ${theme.transition.normal('opacity')};
}
.ne-accordion-stepper .ne-accordion-stepper-content.actived .ne-accordion-stepper-content-layout {
    opacity: 1;
}
`)