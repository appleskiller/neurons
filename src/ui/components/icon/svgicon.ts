
import { UIBinding, Property } from '../../factory/decorator';
import { ISVGIcon } from '../../../utils/domutils';
import { StateChanges } from '../../compiler/common/interfaces';

export interface ISvgIconState {
    icon: ISVGIcon;
}

@UIBinding({
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
            width: 100%;
            height: 100%;
            text-align: center;
        }
        .ne-icon svg:not(:root).ne-svg-icon {
            overflow: visible;
            display: inline-block;
            vertical-align: middle;
            font-size: inherit;
            width: 1em;
            height: 1em;
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
    @Property() prefix = '';
    @Property() iconName = '';
    @Property() iconWidth = 0;
    @Property() iconHeight = 0;
    @Property() iconLigatures = [];
    @Property() iconUnicode = '';
    @Property() iconPath = '';
    
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