import { Binding, Element, Property, Emitter, Inject } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector } from '../../binding/common/interfaces';
import { nativeApi } from '../../binding/common/domapi';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { theme } from '../style/theme';
import { file, import_icon } from '../icon/icons';
import { IHttpProgress } from '../../helper/httpclient';
import { asPromise } from 'neurons-utils';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';

function isHttpProgress(token: any): boolean {
    return token && token.completed && token.failed && token.canceled && token.progress;
}

@Binding({
    selector: 'ne-file-upload-trigger',
    template: `<div [class]="{'ne-file-upload-trigger': true, 'uploading': uploading}" >
        <ne-button [mode]="'flat'" [color]="'primary'" (click)="onClick($event)">
            <ne-icon [icon]="icon"/>
            <span>{{label}}</span>
        </ne-button>
        <input #uploadInput type="file" [title]="' '" [accept]="accept">
    </div>`,
    style: `
        .ne-file-upload-trigger {
            position: relative;
            overflow: hidden;
        }
        .ne-file-upload-trigger input[type="file"] {
            position: absolute;
            opacity: 0;
            left: 0;
            cursor: pointer;
            width: 100%;
            height: 100%;
            top: 0;
            font-size: 0;
        }
        .ne-file-upload-trigger.uploading > input {
            display: none;
        }
        .ne-file-upload-trigger > .ne-button {
            display: block;
        }
    `
})
export class FileUploadTrigger {
    @Property() accept: string = '';
    @Property() label: string = '上传';
    @Property() icon: ISVGIcon = import_icon;
    @Property() uploadApi: (input: HTMLInputElement) => Promise<string> | ObservableLike<string> | IHttpProgress;

    @Emitter() begin: IEmitter<HTMLInputElement>;
    @Emitter() completed: IEmitter<any>;
    @Emitter() failed: IEmitter<any>;
    @Emitter() canceled: IEmitter<void>;

    @Element('uploadInput') uploadInput: HTMLInputElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    uploading = false;

    onInit() {
        const self = this;
        this.uploadInput.onchange = function () {
            if (self.uploading) return;
            self.uploading = true;
            // self.label = '上传';
            const fileDom = this as HTMLInputElement;
            self.begin.emit(fileDom);
            if (self.uploadApi) {
                const success = result => {
                    self.uploading = false;
                    // self.label = '上传';
                    self.cdr.detectChanges();
                    self.completed.emit(result);
                }
                const failed = error => {
                    self.uploading = false;
                    // self.label = '上传';
                    self.cdr.detectChanges();
                    self.failed.emit(error);
                }
                const canceled = () => {
                    self.uploading = false;
                    // self.label = '上传';
                    self.cdr.detectChanges();
                    self.canceled.emit();
                }
                const token = self.uploadApi(fileDom);
                if (isHttpProgress(token)) {
                    const httpProgress = token as IHttpProgress;
                    httpProgress.completed.listen(success);
                    httpProgress.failed.listen(failed);
                    httpProgress.canceled.listen(canceled);
                } else {
                    asPromise(token).then(success).catch(failed);
                }
            }
            fileDom.setAttribute('type', 'text');
            fileDom.setAttribute('type', 'file');
            self.cdr.detectChanges();
        };
    }
}
