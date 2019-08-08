
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isDomLevel2 = isBrowser && !!window.addEventListener;