import { internalThemeManager } from '../../cdk/theme/manager';

export const theme = {
    transition: {
        slow: function (...args) {
            const param = '680ms cubic-bezier(.4,0,.2,1)';
            return args.length ? args.join(` ${param}, `) + ` ${param}` : '';
        },
        normal: function (...args) {
            const param = '280ms cubic-bezier(.4,0,.2,1)';
            return args.length ? args.join(` ${param}, `) + ` ${param}` : '';
        },
        fast: function (...args) {
            const param = '140ms cubic-bezier(.4,0,.2,1)';
            return args.length ? args.join(` ${param}, `) + ` ${param}` : '';
        },
    },
    // color
    color: {
        primary: 'rgba(26, 115, 232, 1)',
        secondary: 'rgba(0, 150, 136, 1)',
        passed: 'rgba(0, 176, 0, 1)',
        warn: 'rgba(244, 139, 54, 1)',
        error: 'rgba(244, 67, 54, 1)',
    },
    // surface

    // gray mix
    gray: {
        light: 'rgba(125, 125, 125, 0.06)',
        normal: 'rgba(125, 125, 125, 0.12)',
        heavy: 'rgba(125, 125, 125, 0.24)',
    },
    // black mix
    black: {
        light: 'rgba(0, 0, 0, 0.4)',
        middle: 'rgba(0, 0, 0, 0.6)',
        heavy: 'rgba(0, 0, 0, 0.8)',
        pure: 'rgba(0, 0, 0, 1)',
    },
    // white mix
    white: {
        light: 'rgba(255, 255, 255, 0.4)',
        middle: 'rgba(255, 255, 255, 0.6)',
        heavy: 'rgba(255, 255, 255, 0.8)',
        pure: 'rgba(255, 255, 255, 1)',
    },
}

internalThemeManager.init(theme);