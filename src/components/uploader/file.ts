import { Binding, Element, Property, Inject } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector } from '../../binding/common/interfaces';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { theme } from '../style/theme';
import { file } from '../icon/icons';
import { ObservableLike, asPromise } from 'neurons-utils';

@Binding({
    selector: 'ne-file-uploader',
    template: `<div [class]="{'ne-file-uploader': true, 'uploading': uploading}" >
        <div [class]="{'ne-file-uploader-file': true, 'ne-ring-spinning-center': uploading, 'error': !!uploadError, 'no-file': !filename}">
            <ne-icon [icon]="iconPlaceholder"/>
        </div>
        <div [class]="{'ne-file-uploader-content': true, 'error': !!uploadError, 'no-hint': '!hint', 'no-file': !filename}">
            <div class="ne-file-uploader-label">{{filename || label}}</div>
            <div class="ne-file-uploader-hint">{{hint}}</div>
        </div>
        <input #uploadInput type="file" [title]="' '" [accept]="accept">
    </div>`,
    style: `
        .ne-file-uploader {
            position: relative;
            overflow: hidden;
            padding: 5px;
            border-radius: 3px;
            cursor: pointer;
            box-sizing: border-box;
            background-Color: transparent;
            transition: ${theme.transition.normal('background-color')};
        }
        .ne-file-uploader:hover {
            background-color: ${theme.gray.normal};
        }
        .ne-file-uploader.uploading {
            cursor: default;
            background-color: ${theme.gray.normal};
        }
        .ne-file-uploader input[type="file"] {
            position: absolute;
            opacity: 0;
            left: 0;
            cursor: pointer;
            width: 100%;
            height: 100%;
            top: 0;
            font-size: 0;
        }
        .ne-file-uploader.uploading > input {
            display: none;
        }
        .ne-file-uploader .ne-file-uploader-file {
            position: relative;
            width: 32px;
            border: solid 2px transparent;
            box-sizing: border-box;
            border-radius: 4px;
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
        }
        .ne-file-uploader .ne-file-uploader-file .ne-icon {
            display: inline-block;
            font-size: 24px;
            transition: ${theme.transition.normal('color')};
            color: ${theme.color.primary};
        }
        .ne-file-uploader .ne-file-uploader-file.no-file .ne-icon {
            color: ${theme.gray.heavy};
        }
        .ne-file-uploader .ne-file-uploader-file.error .ne-icon {
            color: ${theme.color.error};
        }
        .ne-file-uploader .ne-file-uploader-content {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 32px;
            right: 0;
            padding: 0 12px;
            box-sizing: border-box;
            user-select: none;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .ne-file-uploader .ne-file-uploader-content .ne-file-uploader-label {
            position: relative;
            color: ${theme.color.primary};
            transition: ${theme.transition.normal('color')}
        }
        .ne-file-uploader .ne-file-uploader-hint {
            position: relative;
            color: ${theme.black.middle};
            font-size: 12px;
            line-height: 12px;
        }
        .ne-file-uploader .ne-file-uploader-content.error .ne-file-uploader-label {
            color: ${theme.color.error}
        }
        .ne-file-uploader .ne-file-uploader-content.no-file .ne-file-uploader-label {
            color: ${theme.black.heavy};
        }
        .ne-file-uploader .ne-ring-spinning-center:after {
            width: 12px;
            height: 12px;
        }
        .ne-file-uploader .ne-file-uploader-content.no-hint .ne-file-uploader-label {
            position: absolute;
            top: 0;
            bottom: 0;
            margin: auto;
            height: 20px;
        }
        .ne-file-uploader .ne-file-uploader-content.no-hint .ne-file-uploader-hint {
            display: none;
        }
    `
})
export class FileUploader {
    @Property() filename: string = '';
    @Property() accept: string = '';
    @Property() label: string = '本地上传';
    @Property() hint: string = '';
    @Property() iconPlaceholder: ISVGIcon = file;
    @Property() uploadApi: (input: HTMLInputElement) => Promise<string> | ObservableLike<string>;

    @Element('uploadInput') uploadInput: HTMLInputElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    uploading = false;
    uploadError = false;
    errorMessage = '';

    onInit() {
        const self = this;
        this.uploadInput.onchange = function () {
            if (self.uploading) return;
            self.uploading = true;
            self.label = '上传中，请稍后...';
            self.errorMessage = '';
            self.uploadError = false;
            const fileDom = this as HTMLInputElement;
            self.uploadApi && asPromise(self.uploadApi(fileDom)).then(filename => {
                self.filename = filename;
                self.uploading = false;
                self.label = filename;
                self.errorMessage = '';
                self.uploadError = false;
                self.cdr.detectChanges();
            }).catch(error => {
                self.uploading = false;
                self.label = '上传失败了，请重试';
                self.uploadError = true;
                self.errorMessage = '';
                self.cdr.detectChanges();
            })
            fileDom.setAttribute('type', 'text');
            fileDom.setAttribute('type', 'file');
            self.cdr.detectChanges();
        };
    }
}
