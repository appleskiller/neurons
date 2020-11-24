import { Style } from '../../binding/factory/decorator';
import { isEmpty, requestFrame } from 'neurons-utils';

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
    .ne-animation-slide-center {
        -webkit-transform: scaleY(0.8);
        -moz-transform: scaleY(0.8);
        -ms-transform: scaleY(0.8);
        transform: scaleY(0.8);
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
    @-webkit-keyframes ne-animation-wave-stretch-delay {
        0%, 40%, 100% {
            -webkit-transform: scaleY(0.4);
                    transform: scaleY(0.4);
        }
        20% {
            -webkit-transform: scaleY(1);
                    transform: scaleY(1);
        }
    }

    @keyframes ne-animation-wave-stretch-delay {
        0%, 40%, 100% {
            -webkit-transform: scaleY(0.4);
                    transform: scaleY(0.4);
        }
        20% {
            -webkit-transform: scaleY(1);
                    transform: scaleY(1);
        }
    }
    .ne-animation-wave {
        width: 32px;
        height: 32px;
        margin: auto;
        text-align: center;
        font-size: 0;
    }
    .ne-animation-wave .ne-animation-rect {
        background-color: rgb(48, 125, 218);
        height: 100%;
        width: 12%;
        margin: 0 1px;
        box-sizing: border-box;
        display: inline-block;
        font-size: 12px;
        display: inline-block;
        -webkit-animation: ne-animation-wave-stretch-delay 1.2s infinite ease-in-out;
                animation: ne-animation-wave-stretch-delay 1.2s infinite ease-in-out;
    }
    .ne-animation-wave .ne-animation-rect-1 {
        -webkit-animation-delay: -1.2s;
                animation-delay: -1.2s;
    }
    .ne-animation-wave .ne-animation-rect-2 {
        -webkit-animation-delay: -1.1s;
                animation-delay: -1.1s;
    }
    .ne-animation-wave .ne-animation-rect-3 {
        -webkit-animation-delay: -1s;
                animation-delay: -1s;
    }
    .ne-animation-wave .ne-animation-rect-4 {
        -webkit-animation-delay: -0.9s;
                animation-delay: -0.9s;
    }
    .ne-animation-wave .ne-animation-rect-5 {
        -webkit-animation-delay: -0.8s;
                animation-delay: -0.8s;
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

