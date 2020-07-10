import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons, Button, stepperModal, Input } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { FileUploader } from '../../../src/components/uploader/file';
import { ImageUploader } from '../../../src/components/uploader/image';
import { FileUploadTrigger } from '../../../src/components/uploader/trigger';

appendCSSTagOnce('uploader-demo-container', `
`)

register({
    title: '步骤',
    cases: [
        {
            title: 'stepperModel(...)',
            bootstrap: container => {
                bind(`
                    <ne-button mode="raised" color="primary" (click)="onShow()">弹出</ne-button>
                `, {
                    requirements: [Button, Input],
                    container: container,
                    state: {
                        onShow: () => {
                            const stepOne: any = {
                                init: (previousData, container, controller) => {
                                    const state = {
                                        active: true,
                                        value: '',
                                        onNext: () => {
                                            controller.forward(state.value);
                                        }
                                    }
                                    stepOne.container = container;
                                    stepOne.ref = bind(`
                                        <div>
                                            <h4>步骤 1</h4>
                                            <div>
                                                <ne-input [(value)]="value" placeholder="请输入..."></ne-input>
                                            </div>
                                            <div>(输入的值将传递到 步骤 2)</div>
                                            <ne-button mode="flat" color="primary" (click)="onNext()">下一步</ne-button>
                                        </div>
                                    `, {
                                        state: state
                                    });
                                },
                                active: (previousData, controller) => {
                                    stepOne.ref.appendTo(stepOne.container);
                                },
                                deactive: (controller) => {
                                    stepOne.ref.detach();
                                },
                                destroy: () => {
                                    stepOne.ref.destroy();
                                }
                            };
                            const stepTwo: any = {
                                stepLabel: '步骤 2',
                                stepDescription: 'asdfasdfadsf',
                                init: (previousData, container, controller) => {
                                    stepTwo.container = container;
                                    stepTwo.ref = bind(`
                                        <div>
                                            <h4>步骤 2</h4>
                                            <div>您在 步骤 1 中输入的值为：</div>
                                            <div>{{value}}</div>
                                            <ne-button mode="flat" color="primary" (click)="onPrevious()">上一步</ne-button>
                                            <ne-button mode="flat" color="primary" (click)="onNext()">完成</ne-button>
                                        </div>
                                    `, {
                                        container: container,
                                        state: {
                                            value: '',
                                            onPrevious: () => {
                                                controller.back();
                                            },
                                            onNext: () => {
                                                controller.forward();
                                            }
                                        }
                                    })
                                },
                                active: (previousData, controller) => {
                                    stepTwo.ref.appendTo(stepTwo.container);
                                    stepTwo.ref.setState({
                                        value: previousData
                                    })
                                },
                                deactive: (controller) => {
                                    stepTwo.ref.detach();
                                },
                                destroy: () => {
                                    stepTwo.ref.destroy();
                                }
                            };
                            const control = stepperModal({
                                panelClass: 'ui-stepper-model'
                            }, [stepOne, stepTwo]);
                            control.forward();
                        }
                    }
                })
            }
        },
        // {
        //     title: 'ne-image-uploader',
        //     bootstrap: container => {
        //         bind(`
        //             <ne-image-uploader [uploadApi]="uploadApi"></ne-image-uploader>
        //         `, {
        //             requirements: [ImageUploader],
        //             container: container,
        //             state: {
        //                 uploadApi: (fileDom: HTMLInputElement) => {
        //                     return new Promise((resovle, reject) => {
        //                         setTimeout(() => {
        //                             resovle('测试文件');
        //                         }, 1000);
        //                     })
        //                 }
        //             }
        //         })
        //     }
        // },
        // {
        //     title: 'ne-file-upload-trigger',
        //     bootstrap: container => {
        //         bind(`
        //             <ne-file-upload-trigger [uploadApi]="uploadApi"></ne-file-upload-trigger>
        //         `, {
        //             requirements: [FileUploadTrigger],
        //             container: container,
        //             state: {
        //                 uploadApi: (fileDom: HTMLInputElement) => {
        //                     const nativeEmitter = new EventEmitter();
        //                     const token = {
        //                         progress: emitter('progress', nativeEmitter),
        //                         completed: emitter('completed', nativeEmitter),
        //                         failed: emitter('failed', nativeEmitter),
        //                         canceled: emitter('canceled', nativeEmitter),
        //                     }
        //                     let count = 0, total = 100;
        //                     const func = () => {
        //                         setTimeout(() => {
        //                             count += 1;
        //                             if (count >= total) {
        //                                 token.completed.emit('测试文件');
        //                             } else {
        //                                 token.progress.emit({ loaded: count, total: total });
        //                                 func();
        //                             }
        //                         }, 300)
        //                     }
        //                     func();
        //                     return token;
        //                 }
        //             }
        //         })
        //     }
        // }
    ]
})