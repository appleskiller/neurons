import { Binding, Element, Property, Inject } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { StateChanges, IChangeDetector } from '../../binding/common/interfaces';
import { BINDING_TOKENS } from '../../binding/factory/injector';
import { theme } from '../style/theme';
import { image } from '../icon/icons';
import { asPromise } from 'neurons-utils';
import { ObservableLike } from 'neurons-utils/utils/asyncutils';

@Binding({
    selector: 'ne-image-uploader',
    template: `<div [class]="{'ne-image-uploader': true, 'uploading': uploading}" >
        <div [class]="{'ne-image-uploader-image': true, 'ne-ring-spinning-center': uploading, 'no-image': !url}" [style.backgroundImage]="url ? 'url(' + url + ')' : ''">
            <ne-icon [icon]="iconPlaceholder"/>
        </div>
        <div [class]="{'ne-image-uploader-content': true, 'error': !!uploadError}">
            <div class="ne-image-uploader-label">{{label}}</div>
            <div class="ne-image-uploader-hint">{{hint}}</div>
        </div>
        <input #uploadInput type="file" [title]="' '" [accept]="accept">
    </div>`,
    style: `
        .ne-image-uploader {
            position: relative;
            overflow: hidden;
            padding: 5px;
            border-radius: 3px;
            cursor: pointer;
            box-sizing: border-box;
            background-Color: transparent;
            transition: ${theme.transition.normal('background-color')};
        }
        .ne-image-uploader:hover {
            background-color: ${theme.gray.normal};
        }
        .ne-image-uploader.uploading {
            cursor: default;
            background-color: transparent;
        }
        .ne-image-uploader input[type="file"] {
            position: absolute;
            opacity: 0;
            left: 0;
            cursor: pointer;
            width: 100%;
            height: 100%;
            top: 0;
            font-size: 0;
        }
        .ne-image-uploader.uploading > input {
            display: none;
        }
        .ne-image-uploader .ne-image-uploader-image {
            position: relative;
            width: 128px;
            height: 128px;
            border: solid 2px ${theme.gray.normal};
            box-sizing: border-box;
            border-radius: 4px;
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
        }
        .ne-image-uploader .ne-image-uploader-image .ne-icon {
            display: none;
            font-size: 80px;
            color: ${theme.gray.heavy};
        }
        .ne-image-uploader .ne-image-uploader-image.no-image .ne-icon {
            display: inline-block;
        }
        .ne-image-uploader .ne-image-uploader-content {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 128px;
            right: 0;
            padding: 0 12px;
            box-sizing: border-box;
            user-select: none;
        }
        .ne-image-uploader .ne-image-uploader-content.error .ne-image-uploader-label {
            color: ${theme.color.error}
        }
        .ne-image-uploader .ne-image-uploader-label {
            position: relative;
            color: ${theme.black.heavy};
        }
        .ne-image-uploader .ne-image-uploader-hint {
            position: relative;
            color: ${theme.black.middle};
            font-size: 12px;
        }
        .ne-image-uploader .ne-ring-spinning-center:after {
            width: 24px;
            height: 24px;
        }
        .ne-image-uploader .ne-image-uploader-image.no-image {
            text-align: center;
        }
        .ne-image-uploader .ne-image-uploader-image.no-image .ne-icon {
            font-size: 90px;
        }
    `
})
export class ImageUploader {
    @Property() url: string = '';
    @Property() accept: string = 'image/*';
    @Property() label: string = '本地上传';
    @Property() hint: string = '支持上传不大于2M的图片文件';
    @Property() iconPlaceholder: ISVGIcon = image;
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
            self.uploadApi && asPromise(self.uploadApi(fileDom)).then(url => {
                self.url = url;
                self.uploading = false;
                self.label = '本地上传';
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
