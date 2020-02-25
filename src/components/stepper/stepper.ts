import { IElementRef } from '../../binding/common/interfaces';
import { IModalOption, modal } from '../dialog';
import { IPopupRef } from '../../cdk/popup/interfaces';
import { createElement, appendCSSTagOnce } from 'neurons-dom';
import { IEmitter, EventEmitter, emitter } from 'neurons-emitter';
import { ISVGIcon } from 'neurons-dom/dom/element';

export interface ISteperControl {
    stepIndex: number;
    stepCount: number;
    stepVisited: boolean;

    forward(result: any): void;
    jump(index, result: any): void;
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
    let ref: IPopupRef<any>, initeds = [];
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

        onCompleted: emitter('completed', _nativeEmitter),

        closeModal: () => {
            ref.close();
        },
        updatePosition: () => {
            ref.updatePosition()
        },
        forward: (result?: any) => {
            if (isCompleted) return;
            const previousStep = steps[controller.stepIndex];
            controller.previousIndex = controller.stepIndex;
            controller.stepIndex += 1;
            previousStep && previousStep.deactive(controller);
            if (controller.stepIndex >= controller.stepCount) {
                controller.onCompleted.emit(result);
                complete();
            } else {
                const currentStep = steps[controller.stepIndex];
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep);
                        controller.stepVisited = false;
                        currentStep.init(result, container, controller);
                    } else {
                        controller.stepVisited = true;
                        currentStep.active(result, controller);
                    }
                    ref.panel.changeState({
                        panelClass: currentStep.panelClass,
                        width: currentStep.width
                    });
                } else {
                    controller.forward(result);
                }
            }
        },
        jump(index, result: any): void {
            if (isCompleted) return;
            if (controller.stepIndex !== index && index >= 0 && index < controller.stepCount) {
                const previousStep = steps[controller.stepIndex];
                controller.previousIndex = controller.stepIndex;
                controller.stepIndex = index;
                previousStep && previousStep.deactive(controller);
                const currentStep = steps[controller.stepIndex];
                if (currentStep) {
                    if (initeds.indexOf(currentStep) === -1) {
                        initeds.push(currentStep)
                        controller.stepVisited = false;
                        currentStep.init(result, container, controller);
                    } else {
                        controller.stepVisited = true;
                        currentStep.active(result, controller);
                    }
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