
import { Binding, Property } from '../../binding/factory/decorator';
import { ISVGIcon } from 'neurons-dom/dom/element';
import { IEmitter } from 'neurons-emitter';
import { StateChanges } from '../../binding/common/interfaces';

export interface ISvgIconState {
    icon: ISVGIcon;
}

@Binding({
    selector: 'ne-icon',
    template: `
        <div class="ne-icon">
            <svg aria-hidden="true" class="ne-svg-icon" [data-prefix]="prefix || ''" [data-icon]="iconName || ''" role="img"
                xmlns="http://www.w3.org/2000/svg" [viewBox]="'0 0 ' + (iconWidth || 0) + ' ' + (iconHeight || 0)">
                <path fill="currentColor" [d]="iconPath || ''"></path>
            </svg><i/>
        </div>
    `,
    style: `
        .ne-icon {
            display: inline-block;
            text-align: center;
        }
        .ne-icon svg:not(:root).ne-svg-icon {
            overflow: visible;
            display: inline-block;
            font-size: inherit;
            width: 1em;
            height: 1em;
            vertical-align: -0.15em;
        }
        .ne-icon > i {
            display: inline-block;
            vertical-align: middle;
            height: 100%;
            width: 0;
        }
    `
})
export class SvgIcon implements ISvgIconState {
    @Property() icon: ISVGIcon;
    prefix = '';
    iconName = '';
    iconWidth = 0;
    iconHeight = 0;
    iconLigatures = [];
    iconUnicode = '';
    iconPath = '';
    
    onChanges(changes: StateChanges) {
        const iconDef: ISVGIcon = this.icon || {} as ISVGIcon;
        this.prefix = iconDef.prefix;
        this.iconName = iconDef.iconName;
        const icon = iconDef.icon || [];
        this.iconWidth = icon[0];
        this.iconHeight = icon[1];
        this.iconLigatures = icon[2];
        this.iconUnicode = icon[3];
        this.iconPath = icon[4];
    }
}