import { IElementRef } from '../../binding/common/interfaces';
import { IModalOption, modal } from '../dialog';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { createElement, appendCSSTagOnce } from 'neurons-dom';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { ISVGIcon } from 'neurons-dom/dom/element';

export interface ISteperControl {
    step: IStepModal;
    stepIndex: number;
    stepCount: number;
    stepVisited: boolean;

    forward(data?: any): void;
    back(data?: any): void;
    jump(index, data?: any): void;
    closeModal: () => void;
    updatePosition: () => void;

    onCompleted: IEmitter<any>;
}

export interface IStepperOption {
    // nextLabel?: string;
    // previousLabel?: string;
    // completeLabel?: string;

    // hideControlButton?: boolean;
}


export interface IStepperModalOption extends IStepperOption {
    panelClass?: string;
    width?: number | string;
    hasOverlay?: boolean;
    overlayClass?: string;
    overlayBackgroundColor?: string;
    autoClose?: boolean;
    disableClose?: boolean;
}

export interface IStep {
    stepLabel?: string;
    stepDescription?: string;
    init(previous: any, container: HTMLElement, controller: ISteperControl): void;
    active(previous: any, controller: ISteperControl): void;
    deactive(controller: ISteperControl): void;
    destroy(): void;

    [key: string]: any;
}

export interface IStepModal extends IStep {
    panelClass?: string;
    width?: number | string;
}

export function stepperModal(option: IStepperModalOption, steps: IStepModal[], initialData?: any): ISteperControl {
    let ref: IPopupRef<any>, initeds = [], datas = [];
    const container = createElement('div', 'ne-stepper-modal');
    const _nativeEmitter = new EventEmitter();
    let isCompleted = false;
    const complete = () => {
        isCompleted = true;
        ref.close();
    }
    const controller = {
        previousIndex: -1,
        stepIndex: -1,
        stepCount: steps.length,
        stepVisited: false,
        step: null,

        onCompleted: emitter('completed', _nativeEmitter),

        closeModal: () => {
            ref.close();
        },
        updatePosition: () => {
            ref.updatePosition()
        },
        forward: function (data?: any) {
            if (isCompleted) return;
            const previousStep = steps[controller.stepIndex];
            controller.previousIndex = controller.stepIndex;
            controller.stepIndex += 1;
            previousStep && previousStep.deactive(controller);
            if (controller.stepIndex >= controller.stepCount) {
                controller.onCompleted.emit(data);
                complete();
            } else {
                datas[controller.stepIndex] = arguments.length ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];
                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep);
                        controller.stepVisited = false;
                        currentStep.init(data, container, controller);
                    }
                    controller.stepVisited = true;
                    currentStep.active(data, controller);
                    ref.panel.changeState({
                        panelClass: currentStep.panelClass,
                        width: currentStep.width
                    });
                } else {
                    controller.forward(data);
                }
            }
        },
        back: function (data?: any) {
            if (isCompleted) return;
            const previousStep = steps[controller.stepIndex];
            controller.previousIndex = controller.stepIndex;
            controller.stepIndex -= 1;
            previousStep && previousStep.deactive(controller);
            if (controller.stepIndex >= 0){
                datas[controller.stepIndex] = arguments.length ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];
                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep);
                        controller.stepVisited = false;
                        currentStep.init(data, container, controller);
                    }
                    controller.stepVisited = true;
                    currentStep.active(data, controller);
                    ref.panel.changeState({
                        panelClass: currentStep.panelClass,
                        width: currentStep.width
                    });
                } else {
                    controller.back(data);
                }
            }
        },
        jump: function (index, data?: any) {
            if (isCompleted) return;
            if (controller.stepIndex !== index && index >= 0 && index < controller.stepCount) {
                const previousStep = steps[controller.stepIndex];
                controller.previousIndex = controller.stepIndex;
                controller.stepIndex = index;
                previousStep && previousStep.deactive(controller);
                datas[controller.stepIndex] = arguments.length >= 2 ? data : datas[controller.stepIndex];
                data = datas[controller.stepIndex];
                const currentStep = steps[controller.stepIndex];
                controller.step = currentStep;
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep)
                        controller.stepVisited = false;
                        currentStep.init(data, container, controller);
                    }
                    controller.stepVisited = true;
                    currentStep.active(data, controller);
                    ref.panel.changeState({
                        panelClass: currentStep.panelClass,
                        width: currentStep.width
                    });
                }
            }
        }
    }
    const opt: IModalOption = {
        width: null,
        ...(option || {}),
        hideOkButton: true,
        hideCancelButton: true,
        body: {
            source: container,
        }
    }
    ref = modal(opt);
    ref.onClosed.listen(() => {
        isCompleted = true;
        _nativeEmitter.off();
        initeds.forEach(step => step && step.destroy());
        initeds = [];
    });
    initialData && controller.forward(initialData);
    return controller;
}

appendCSSTagOnce('ne-ui-stepper', `
.ne-stepper-modal {
    position: relative;
}
`)