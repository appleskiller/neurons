import { Binding, Inject, BINDING_TOKENS, Element, Property } from '../../binding';
import { IChangeDetector, IElementRef } from '../../binding/common/interfaces';
import { errorToMessage } from '../../binding/common/exception';
import { removeMe } from 'neurons-dom';
import { Button } from '../../components';

@Binding({
    selector: 'ne-loading-mask',
    template: `
        <div #element class="ne-loading-mask" [class.active]="!!showLoading || !!showRetry">
            <div [class.ne-loading-ring-spin]="!showRetry" [class.active]="showLoading">
                <div class="ne-animation-wave">
                    <div class="ne-animation-rect ne-animation-rect-1"></div>
                    <div class="ne-animation-rect ne-animation-rect-2"></div>
                    <div class="ne-animation-rect ne-animation-rect-3"></div>
                    <div class="ne-animation-rect ne-animation-rect-4"></div>
                    <div class="ne-animation-rect ne-animation-rect-5"></div>
                </div>
            </div>
            <div class="ne-retry-container" [class.active]="showRetry">
                <div class="ne-retry-message">{{retryMessage}}</div>
                <ne-button mode="raised" color="primary" (click)="onRetryClick($event)">重试</ne-button>
            </div>
            <span class="ne-text-link ne-cancel-retry" [class.active]="!!showLoading || !!showRetry" (click)="onCancelRetry($event)">取消</span>
        </div>
    `,
    style: `
        .ne-loading-mask {
            background-color: rgba(255, 255, 255, 0.02);
            transition: $transition.slow('opacity');
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: -99999999;
            overflow: hidden;
            opacity: 0;
        
            &.active {
                opacity: 1;
                z-index: 99999999;
            }
        
            .ne-animation-wave {
                display: none;
            }
            .ne-loading-ring-spin {
                position: absolute;
                margin: auto;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                opacity: 0;
        
                &.active {
                    opacity: 1;
                }
        
                .ne-animation-wave {
                    display: block;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    margin: auto;
                    position: absolute;
                }
            }
        
            .ne-retry-container {
                position: absolute;
                margin: auto;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                height: 80px;
                text-align: center;
                display: none;
        
                &.active {
                    display: block;
                }
        
                .ne-retry-message {
                    margin-bottom: 16px;
                }
            }
        
            .ne-cancel-retry {
                position: absolute;
                right: 0;
                bottom: 0;
                line-height: 36px;
                padding: 0 12px;
                font-size: 15px;
                opacity: 0;
        
                &.active {
                    opacity: 1;
                }
            }
            .ne-text-link {
                cursor: pointer;
                transition: $transition.normal('color');
                color: $color.primary;
                text-decoration: none;
                user-select: none;
                &:hover {
                    color: $color.primary;
                    text-decoration: underline;
                }
            }
        }
    `,
    requirements: [
        Button
    ]
})
export class LoadingMask {
    @Property() retryMessage: string;
    @Property() retryFunction: any;
    @Property() cancelFunction: any;

    @Element('element') element: HTMLElement;
    @Inject(BINDING_TOKENS.CHANGE_DETECTOR) cdr: IChangeDetector;

    private _destroyed;
    showRetry = false;
    showLoading = true;

    onInit() {
    }
    onChanges() {
        if (this.retryMessage) {
            this.showLoading = false;
            this.showRetry = true;
        } else {
            this.showLoading = true;
            this.showRetry = false;
        }
    }
    onDestroy() {
        this._destroyed = true;
    }
    onRetryClick(e) {
        // 当不存在e时，是因为在表单中此按钮成为了默认按钮，同时被按下了Enter
        if (!e || (e.screenX === 0 && e.screenY === 0)) return;
        this.showLoading = true;
        this.showRetry = false;
        this.retryMessage = '';
        this.retryFunction && this.retryFunction();
    }
    onCancelRetry(e) {
        this.showLoading = false;
        this.showRetry = false;
        this.retryMessage = '';
        this.cancelFunction && this.cancelFunction();
    }
}
