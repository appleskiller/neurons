import { PopupPosition, PopupAnimation } from './interfaces';

export const popupPositionStyle = {
    [PopupPosition.center]: {
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
    },
    [PopupPosition.top]: {
        'left': '50%',
        'transform': 'translateX(-50%)',
    },
    [PopupPosition.bottom]: {
        'bottom': '0',
        'left': '50%',
        'transform': 'translateX(-50%)',
    },
    [PopupPosition.left]: {
        'top': '50%',
        'transform': 'translateY(-50%)',
    },
    [PopupPosition.right]: {
        'right': '0',
        'top': '50%',
        'transform': 'translateY(-50%)',
    },
    [PopupPosition.topLeft]: {},
    [PopupPosition.topRight]: {
        right: '0'
    },
    [PopupPosition.bottomLeft]: {
        left: '0',
        bottom: '0',
    },
    [PopupPosition.bottomRight]: {
        right: '0',
        bottom: '0',
    },
}

export const popupPosition2AnimationType = {
    [PopupPosition.center]: PopupAnimation.scaleUp,
    [PopupPosition.top]: PopupAnimation.slideDown,
    [PopupPosition.bottom]: PopupAnimation.slideUp,
    [PopupPosition.left]: PopupAnimation.slideRight,
    [PopupPosition.right]: PopupAnimation.slideLeft,
    [PopupPosition.topLeft]: PopupAnimation.slideRight,
    [PopupPosition.topRight]: PopupAnimation.slideLeft,
    [PopupPosition.bottomLeft]: PopupAnimation.slideRight,
    [PopupPosition.bottomRight]: PopupAnimation.slideLeft,
}
