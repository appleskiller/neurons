import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { FileUploader } from '../../../src/components/uploader/file';
import { ImageUploader } from '../../../src/components/uploader/image';
import { FileUploadTrigger } from '../../../src/components/uploader/trigger';

appendCSSTagOnce('uploader-demo-container', `
`)

register({
    title: '上传',
    cases: [
        {
            title: 'ne-file-uploader',
            bootstrap: container => {
                bind(`
                    <ne-file-uploader [uploadApi]="uploadApi"></ne-file-uploader>
                `, {
                    requirements: [FileUploader],
                    container: container,
                    state: {
                        uploadApi: (fileDom: HTMLInputElement) => {
                            return new Promise((resovle, reject) => {
                                setTimeout(() => {
                                    resovle('测试文件');
                                }, 1000);
                            })
                        }
                    }
                })
            }
        }, {
            title: 'ne-image-uploader',
            bootstrap: container => {
                bind(`
                    <ne-image-uploader [uploadApi]="uploadApi"></ne-image-uploader>
                `, {
                    requirements: [ImageUploader],
                    container: container,
                    state: {
                        uploadApi: (fileDom: HTMLInputElement) => {
                            return new Promise((resovle, reject) => {
                                setTimeout(() => {
                                    resovle('测试文件');
                                }, 1000);
                            })
                        }
                    }
                })
            }
        },
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