import { Binding, Property, Element } from '../../binding/factory/decorator';
import { StateChanges } from '../../binding/common/interfaces';
import { ISVGShape } from '../interfaces';
import { isDefined } from 'neurons-utils';
import { removeMe, createElement } from 'neurons-dom';

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
        <div class="ne-svg-shape" #content></div>
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

    @Element('content') content: HTMLElement;

    onChanges(changes: StateChanges) {
        this._updateDisplay(this.shape);
    }
    onDestroy() {
        this._nativeShape && this._nativeShape.destroy();
    }
    private _nativeShape: SVGPathShape | SVGDataURIShape;
    private _updateDisplay(shape: (ISVGShape | string)) {
        if (shape) {
            shape = this._normalizeShape(shape)
            if (this._nativeShape && (shape.type || 'path') !== this._nativeShape.type) {
                this._nativeShape.destroy();
                this._nativeShape = null;
            }
            if (!this._nativeShape) {
                if (shape.type === 'dataURI') {
                    this._nativeShape = new SVGDataURIShape(this.content);
                } else {
                    this._nativeShape = new SVGPathShape(this.content);
                }
            }
            this._nativeShape.render(shape);
        } else {
            this._nativeShape && this._nativeShape.destroy();
            this._nativeShape = null;
        }
    }
    private _normalizeShape(shape: ISVGShape | string): ISVGShape {
        if (typeof shape === 'string') {
            return {
                type: 'path',
                
                prefix: undefined,
                shapeName: undefined,
                shape: [0, 0, [], '', shape],
                
                fill: 'currentColor',
                fillRule: undefined,
                stroke: undefined,
                strokeWidth: undefined,
                strokeLinecap: undefined,
                strokeLinejoin: undefined,
                strokeDasharray: undefined,
                strokeDashoffset: undefined,
    
                align: undefined,
                verticalAlign: undefined,
                sizing: undefined,
            }
        } else {
            return {
                ...shape,
                align: this.align,
                verticalAlign: this.verticalAlign,
                sizing: this.sizing,
            }
        }
    }
}

export class SVGPathShape {
    constructor(private _parent: HTMLElement) {
    }
    type = 'path';
    private _shape: ISVGShape = {} as ISVGShape;
    private _svg: SVGElement;
    private _path: SVGPathElement;
    render(shape: ISVGShape): void {
        if (shape && this._parent && !this._svg) {
            this._svg = createElement('svg', '', null, 'http://www.w3.org/2000/svg') as any;
            this._svg.setAttribute('aria-hidden', 'true');
            this._svg.setAttribute('role', 'img');
            this._path = createElement('path', '', null, 'http://www.w3.org/2000/svg') as any;
            this._svg.appendChild(this._path);
            this._parent.appendChild(this._svg);
        }
        if (this._svg) {
            shape = shape || {} as ISVGShape;
            'prefix' in shape && this._set('data-prefix', shape.prefix, this._svg);
            'shapeName' in shape && this._set('data-shape', shape.shapeName, this._svg);

            'shape' in shape && (this._shape.shape = shape.shape);
            const shapeConfig = this._shape.shape || [];
            const viewBox = shapeConfig[0] && shapeConfig[1] ? '0 0 ' + (shapeConfig[0] || 0) + ' ' + (shapeConfig[1] || 0) : undefined;
            this._set('viewBox', viewBox, this._svg);
            const d = shapeConfig[4] || undefined;
            this._set('d', d, this._path);

            'align' in shape && (this._shape.align = shape.align);
            'verticalAlign' in shape && (this._shape.verticalAlign = shape.verticalAlign);
            'sizing' in shape && (this._shape.sizing = shape.sizing);
            const preserveAspectRatio = this._shape.sizing === 'scale' ? `none` : `${aligns[this._shape.align || '']}${verticalAligns[this._shape.verticalAlign || '']} ${sizings[this._shape.sizing || '']}`;
            this._set('preserveAspectRatio', preserveAspectRatio, this._svg);

            let fill = shape.fill || 'currentColor';
            fill === 'transparent' && (fill = 'rgba(0,0,0,0)');
            this._set('fill', fill, this._path);
            'fillRule' in shape && this._set('fill-rule', shape.fillRule || undefined, this._path);
            'stroke' in shape && this._set('stroke', shape.stroke || undefined, this._path);
            'strokeWidth' in shape && this._set('stroke-width', shape.strokeWidth || undefined, this._path);
            'strokeLinecap' in shape && this._set('stroke-linecap', shape.strokeLinecap || undefined, this._path);
            'strokeLinejoin' in shape && this._set('stroke-linejoin', shape.strokeLinejoin || undefined, this._path);
            'strokeDasharray' in shape && this._set('stroke-dasharray', shape.strokeDasharray || undefined, this._path);
            'strokeDashoffset' in shape && this._set('stroke-dashoffset', shape.strokeDashoffset || undefined, this._path);

        }
    }
    resize(): void {
    }
    destroy() {
        removeMe(this._svg);
    }
    detach() {
        removeMe(this._svg);
    }
    attach() {
        if (this._parent && !this._parent.contains(this._svg)) {
            this._parent.appendChild(this._svg);
        }
    }
    private _set(prop, newValue, dom) {
        if (this._shape[prop] !== newValue) {
            this._shape[prop] = newValue;
            if (isDefined(newValue)) {
                dom.setAttribute(prop, newValue);
            } else {
                dom.removeAttribute(prop);
            }
        }
    }
}

export class SVGDataURIShape {
    constructor(private _parent: HTMLElement) {
    }
    type = 'dataURI';
    private _shape: ISVGShape = {} as ISVGShape;
    private _svg: SVGElement;
    private _image: SVGPathElement;
    render(shape: ISVGShape): void {
        if (shape && this._parent && !this._svg) {
            this._svg = createElement('svg', '', null, 'http://www.w3.org/2000/svg') as any;
            this._svg.setAttribute('aria-hidden', 'true');
            this._svg.setAttribute('role', 'img');
            this._image = createElement('image', '', null, 'http://www.w3.org/2000/svg') as any;
            this._svg.appendChild(this._image);
            this._parent.appendChild(this._svg);
        }
        if (this._svg) {
            shape = shape || {} as ISVGShape;
            'prefix' in shape && this._set('data-prefix', shape.prefix, this._svg);
            'shapeName' in shape && this._set('data-shape', shape.shapeName, this._svg);

            'shape' in shape && (this._shape.shape = shape.shape);
            const shapeConfig = this._shape.shape || [];
            const viewBox = shapeConfig[0] && shapeConfig[1] ? '0 0 ' + (shapeConfig[0] || 0) + ' ' + (shapeConfig[1] || 0) : undefined;
            this._set('viewBox', viewBox, this._svg);
            const dataURI = shapeConfig[4] || undefined;
            this._set('href', dataURI, this._image);
            this._set('width', shapeConfig[0] || 0, this._image);
            this._set('height', shapeConfig[1] || 0, this._image);

            'align' in shape && (this._shape.align = shape.align);
            'verticalAlign' in shape && (this._shape.verticalAlign = shape.verticalAlign);
            'sizing' in shape && (this._shape.sizing = shape.sizing);
            const preserveAspectRatio = this._shape.sizing === 'scale' ? `none` : `${aligns[this._shape.align || '']}${verticalAligns[this._shape.verticalAlign || '']} ${sizings[this._shape.sizing || '']}`;
            this._set('preserveAspectRatio', preserveAspectRatio, this._svg);
        }
    }
    resize(): void {
    }
    destroy() {
        removeMe(this._svg);
    }
    detach() {
        removeMe(this._svg);
    }
    attach() {
        if (this._parent && !this._parent.contains(this._svg)) {
            this._parent.appendChild(this._svg);
        }
    }
    private _set(prop, newValue, dom) {
        if (this._shape[prop] !== newValue) {
            this._shape[prop] = newValue;
            if (isDefined(newValue)) {
                dom.setAttribute(prop, newValue);
            } else {
                dom.removeAttribute(prop);
            }
        }
    }
}