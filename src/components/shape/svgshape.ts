import { Binding, Property, Element } from '../../binding/factory/decorator';
import { StateChanges } from '../../binding/common/interfaces';
import { ISVGShape } from '../interfaces';

const aligns = {
    '': 'xMid',
    'left': 'xMin',
    'center': 'xMid',
    'right': 'xMax',
}
const verticalAligns = {
    '': 'YMid',
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
    selector: 'ne-svg-shape',
    template: `
        <div class="ne-svg-shape">
            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"
                #content
                [data-prefix]="prefix"
                [data-shape]="shapeName"
                [viewBox]="viewBox"
                [preserveAspectRatio]="preserveAspectRatio"
            >
                <path
                    [d]="shapePath"
                    [fill]="fill"
                    [fill-rule]="fillRule"
                    [stroke]="stroke"
                    [stroke-width]="strokeWidth"
                    [stroke-linecap]="strokeLinecap"
                    [stroke-linejoin]="strokeLinejoin"
                    [stroke-dasharray]="strokeDasharray"
                    [stroke-dashoffset]="strokeDashoffset"
                ></path>
            </svg>
        </div>
    `,
    style: `
        .ne-svg-shape {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .ne-svg-shape > svg {
            width: 100%;
            height: 100%;
            vertical-align: top;
        }
    `
})
export class SvgShape {
    @Property() shape: ISVGShape | string;
    @Property() align: 'left' | 'center' | 'right' = 'center';
    @Property() verticalAlign: 'top' | 'middle' | 'bottom' = 'middle';
    @Property() sizing: 'contain' | 'cover' | 'scale' = 'contain';

    @Element('content') content: SVGElement;

    prefix;
    shapeName;
    shapePath;
    viewBox;
    preserveAspectRatio = 'xMidYMid meet';

    fill: string = 'currentColor';
    fillRule: 'nonzero' | 'evenodd';
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'butt' | 'round' | 'square';
    strokeLinejoin: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs';
    strokeDasharray: string;
    strokeDashoffset: number;

    onChanges(changes: StateChanges) {
        this._updateDisplay(this.shape);
    }
    private _updateDisplay(shape: (ISVGShape | string)) {
        if (shape && typeof shape === 'object') {
            this.prefix = shape.prefix;
            this.shapeName = shape.shapeName;
            const shapeConfig = shape.shape || [];
            this.shapePath = shapeConfig[4];
            this.viewBox = shapeConfig[0] && shapeConfig[1] ? '0 0 ' + (shapeConfig[0] || 0) + ' ' + (shapeConfig[1] || 0) : undefined;
        
            this.fill = shape.fill || 'currentColor';
            this.fill === 'transparent' && (this.fill = 'rgba(0,0,0,0)')
            this.fillRule = shape.fillRule || undefined;
            this.stroke = shape.stroke || undefined;
            this.strokeWidth = shape.strokeWidth || undefined;
            this.strokeLinecap = shape.strokeLinecap || undefined;
            this.strokeLinejoin = shape.strokeLinejoin || undefined;
            this.strokeDasharray = shape.strokeDasharray || undefined;
            this.strokeDashoffset = shape.strokeDashoffset || undefined;
        } else {
            this.prefix = undefined;
            this.shapeName = undefined;
            this.shapePath = (shape as string) || undefined;
            this.viewBox = undefined;

            this.fill = 'currentColor';
            this.fillRule = undefined;
            this.stroke = undefined;
            this.strokeWidth = undefined;
            this.strokeLinecap = undefined;
            this.strokeLinejoin = undefined;
            this.strokeDasharray = undefined;
            this.strokeDashoffset = undefined;
        }
        this.preserveAspectRatio = this.sizing === 'scale' ? `none` : `${aligns[this.align || '']}${verticalAligns[this.verticalAlign || '']} ${sizings[this.sizing || '']}`;
    }
}