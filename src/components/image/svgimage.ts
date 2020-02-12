
import { StateChanges } from '../../binding/common/interfaces';
import { Element, Property, Binding } from '../../binding/factory/decorator';

const aligns = {
    '': 'xMin',
    'left': 'xMin',
    'center': 'xMid',
    'right': 'xMax',
}
const verticalAligns = {
    '': 'YMin',
    'top': 'YMin',
    'middle': 'YMid',
    'bottom': 'YMax',
}
const sizings = {
    '': 'meet',
    'contain': 'meet',
    'cover': 'slice',
}

@Binding({
    selector: 'ne-svg-image',
    template: `
        <div #content class="ne-svg-image"></div>
    `,
    style: `
        .ne-svg-image > svg {
            width: 100%;
            height: 100%;
        }
    `
})
export class SvgImage {
    @Property() src: string = '';
    @Property() align: 'left' | 'center' | 'right' = 'left';
    @Property() verticalAlign: 'top' | 'middle' | 'bottom' = 'top';
    @Property() sizing: 'contain' | 'cover' | 'scale' = 'contain';

    @Element('content') content: HTMLElement;

    onChanges(changes: StateChanges) {
        let resetSizing = false;
        if (!changes || 'src' in changes) {
            this.content.innerHTML = this.src;
            const svg: SVGElement = this.content.children.item(0) as SVGElement;
            if (svg) {
                svg.removeAttribute('x');
                svg.removeAttribute('y');
                svg.removeAttribute('width');
                svg.removeAttribute('height');
            }
            resetSizing = true;
        }
        if ((!changes || 'align' in changes || 'verticalAlign' in changes || 'sizing' in changes)) {
            resetSizing = true;
        }
        resetSizing && this._resetSizing();
    }
    private _resetSizing() {
        const svg: SVGElement = this.content.children.item(0) as SVGElement;
        if (svg) {
            const preserveAspectRatio = this.sizing === 'scale' ? `none` : `${aligns[this.align || '']}${verticalAligns[this.verticalAlign || '']} ${sizings[this.sizing || '']}`;
            svg.setAttribute('preserveAspectRatio', preserveAspectRatio);
        }
    }
}