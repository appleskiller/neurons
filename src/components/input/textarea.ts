import { Binding, Element, Property } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { Input } from './input';
import { theme } from '../style/theme';

@Binding({
    selector: 'ne-textarea',
    template: `<textarea #input
        [class]="{'ne-textarea': true, 'invalid': invalid}"
        [resize]="resize"
        [name]="name"
        [maxlength]="maxLength"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete ? 'on' : 'off'"
        (propertychange)="onInputChange($event)"
        (keyup)="onKeyUp($event)"
        (input)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
    ></textarea>`,
    style: `
        .ne-textarea {
            display: inline;
            outline: none;
            background-color: transparent;
            color: inherit;
            border: solid 1px rgba(125, 125, 125, 0.3);
            border-radius: 3px;
            padding: 4px 6px;
            font-size: inherit;
            transition: border-color 280ms cubic-bezier(.4,0,.2,1);
            box-sizing: border-box;
            font-family: inherit;
            cursor: auto;
        }
        .ne-textarea[readonly] {
            cursor: default;
        }
        .ne-textarea[disabled] {
            opacity: 0.3;
        }
        .ne-textarea:not([readonly]):hover {
            border: solid 1px rgba(125, 125, 125, 0.5);
        }
        .ne-textarea:not([readonly]):focus {
            border: solid 1px rgba(48, 125, 218, 0.8);
        }
        .ne-textarea.invalid {
            border-color: ${theme.color.error};
        }
        .ne-textarea.invalid::-webkit-input-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-textarea.invalid::-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-textarea.invalid:-moz-placeholder {
            color: #f44336;
            border-color: #f44336;
         }
        .ne-textarea.invalid:-ms-input-placeholder {
           color: #f44336;
           border-color: #f44336;
        }
        .ne-textarea[resize=none] {
            resize: none;
        }
        .ne-textarea[resize=auto] {
            resize: auto;
        }
        .ne-textarea[resize=horizontal] {
            resize: horizontal;
        }
        .ne-textarea[resize=vertical] {
            resize: vertical;
        }
    `
})
export class TextArea extends Input {
    @Property() resize: 'none' | 'auto' | 'horizontal' | 'vertical' = 'auto';
    @Property() autoHeight: boolean = false;

    onChanges(changes) {
        super.onChanges();
        if (changes && 'value' in changes) {
            this.calcAutoHeight();
        }
    }

    onInputChange(e: KeyboardEvent) {
        super.onInputChange(e);
        this.calcAutoHeight();
    }

    protected calcAutoHeight() {
        if (this.autoHeight) {
            const borderHeight = this.input.offsetHeight - this.input.clientHeight;
            const scrollHeight = this.input.scrollHeight;
            this.input.style.height = '';
            this.input.style.height = Math.min(this.input.scrollHeight, scrollHeight) + borderHeight + 'px';
        }
    }
}