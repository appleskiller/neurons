import { theme } from './theme';
import { appendCSSTagOnce } from 'neurons-dom';

appendCSSTagOnce('ne-common-animation', `

@-webkit-keyframes ne-spinning {
    0% {
        -webkit-transform: rotate(0);
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    }
    50% {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
@-moz-keyframes ne-spinning {
    0% {
        -webkit-transform: rotate(0);
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    }
    50% {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
@-webkit-keyframes ne-spinning {
    0% {
        -webkit-transform: rotate(0);
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    }
    50% {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
@-o-keyframes ne-spinning {
    0% {
        -webkit-transform: rotate(0);
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    }
    50% {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
@keyframes ne-spinning {
    0% {
        -webkit-transform: rotate(0);
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    }
    50% {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}

.ne-ring-spinning-center {
    position: relative;
    color: inherit;
}
.ne-ring-spinning-center:before {
    content: ' ';
    display: inline-block;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    background-color: ${theme.white.middle}
}
.ne-ring-spinning-center:after {
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    -webkit-animation: ne-spinning 1s infinite;
    animation: ne-spinning 1s infinite;
    content: " ";
    display: inline-block;
    background: center center no-repeat;
    background-size: cover;
    vertical-align: middle;
    border-radius: 50%;
    border: 4px solid;
    -webkit-background-clip: padding-box;
    border-color: currentColor currentColor currentColor transparent;
    width: 8px;
    height: 8px;
    color: ${theme.color.primary};
    z-index: 1010;
}

`)