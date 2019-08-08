import { requestFrame } from '../../../utils';
import { Style } from '../../factory/decorator';

export interface IAnimationConfig {
    duration?: number;
    onEnter?: () => void;
    onDone?: () => void;
}

export type CancelAnimationFunction = () => void;

@Style(`
    .ne-animation {
        -webkit-transition: all 180ms cubic-bezier(.4,0,.2,1);
        -moz-transition: all 180ms cubic-bezier(.4,0,.2,1);
        transition: all 180ms cubic-bezier(.4,0,.2,1);
    }
    .ne-animation-done {
        -webkit-transform: none !important;
        -moz-transform: none !important;
        -ms-transform: none !important;
        transform: none !important;
    }
    .ne-animation-fast {
        -webkit-transition-duration: 120ms;
        -moz-transition-duration: 120ms;
        transition-duration: 120ms;
    }
    
    .ne-animation-fade {
        opacity: 0;
    }
    .ne-animation-fade.ne-animation-done {
        opacity: 1;
    }

    .ne-animation-scale-up {
        -webkit-transform: scale(0.8);
        -moz-transform: scale(0.8);
        -ms-transform: scale(0.8);
        transform: scale(0.8);
    }
    .ne-animation-scale-down {
        -webkit-transform: scale(1.2);
        -moz-transform: scale(1.2);
        -ms-transform: scale(1.2);
        transform: scale(1.2);
    }

    .ne-animation-slide-up {
        -webkit-transform: translateY(20%);
        -moz-transform: translateY(20%);
        -ms-transform: translateY(20%);
        transform: translateY(20%);
    }
    .ne-animation-slide-down {
        -webkit-transform: translateY(-20%);
        -moz-transform: translateY(-20%);
        -ms-transform: translateY(-20%);
        transform: translateY(-20%);
    }
    .ne-animation-slide-left {
        -webkit-transform: translateX(20%);
        -moz-transform: translateX(20%);
        -ms-transform: translateX(20%);
        transform: translateX(20%);
    }
    .ne-animation-slide-right {
        -webkit-transform: translateX(-20%);
        -moz-transform: translateX(-20%);
        -ms-transform: translateX(-20%);
        transform: translateX(-20%);
    }

    .ne-animation-spread-up {
        -webkit-transform: translateY(10%) scaleY(0.8);
        -moz-transform: translateY(10%) scaleY(0.8);
        -ms-transform: translateY(10%) scaleY(0.8);
        transform: translateY(10%) scaleY(0.8);
    }
    .ne-animation-spread-down {
        -webkit-transform: translateY(-10%) scaleY(0.8);
        -moz-transform: translateY(-10%) scaleY(0.8);
        -ms-transform: translateY(-10%) scaleY(0.8);
        transform: translateY(-10%) scaleY(0.8);
    }
    .ne-animation-spread-left {
        -webkit-transform: translateX(10%) scaleX(0.8);
        -moz-transform: translateX(10%) scaleX(0.8);
        -ms-transform: translateX(10%) scaleX(0.8);
        transform: translateX(10%) scaleX(0.8);
    }
    .ne-animation-spread-right {
        -webkit-transform: translateX(-10%) scaleX(0.8);
        -moz-transform: translateX(-10%) scaleX(0.8);
        -ms-transform: translateX(-10%) scaleX(0.8);
        transform: translateX(-10%) scaleX(0.8);
    }
    .ne-animation-spread-middle {
        -webkit-transform: scaleY(0.8);
        -moz-transform: scaleY(0.8);
        -ms-transform: scaleY(0.8);
        transform: scaleY(0.8);
    }
`)
export class Animation {
    static start(config: IAnimationConfig): CancelAnimationFunction {
        const animation = new Animation(config);
        return animation.start();
    }
    constructor(config: IAnimationConfig){
        this._config = config || {} as IAnimationConfig;
    }
    private _beginTime;
    private _doneTimeID;
    private _config: IAnimationConfig;
    start(): CancelAnimationFunction {
        this._beginTime && this._beginTime();
        clearTimeout(this._doneTimeID);
        this._beginTime = requestFrame(() => {
            this._config.onEnter && this._config.onEnter();
            this._doneTimeID = setTimeout(() => {
                this._config.onDone && this._config.onDone();
            }, this._config.duration || 300);
        });
        return () => {
            this._cancel();
        };
    }
    private _cancel() {
        this._beginTime && this._beginTime();
        clearTimeout(this._doneTimeID);
    }
}




