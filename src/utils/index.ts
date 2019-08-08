import { isDefined } from './typeutils';

declare const msCrypto;

export function noop() {}
export * from './arrayutils';
export * from './asyncutils';
export * from './cacheutils';
export * from './decoratorutils';
export * from './objectutils';
export * from './osutils';
export * from './typeutils';

const getRandomValues = (typeof (crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
    (typeof (msCrypto) != 'undefined' && typeof window['msCrypto'].getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

function rng() {
    if (getRandomValues) {
        const rnds8 = new Uint8Array(16);
        getRandomValues(rnds8);
        return rnds8;
    } else {
        const rnds = new Array(16);
        for (let i = 0, r; i < 16; i++) {
            if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
            rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }
        return rnds;
    }
}
const byteToHex = [];
for (let byteIndex = 0; byteIndex < 256; ++byteIndex) {
    byteToHex[byteIndex] = (byteIndex + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf) {
    let i = 0;
    const bth = byteToHex;
    return ([bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]]).join('');
}

// uuid v4
export function uuid() {
    const rnds = rng();
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    return bytesToUuid(rnds);
}

export class Map<K, V> {
    private _keys: K[] = [];
    private _values: V[] = [];
    get(key: K): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            return this._values[index];
        } else {
            return undefined;
        }
    }
    set(key: K, value: V): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            this._values[index] = value;
        } else {
            this._keys.push(key);
            this._values.push(value);
        }
        return value;
    }
    has(key: K): boolean {
        if (!key) return false;
        return (this._keys.indexOf(key) !== -1);
    }
    del(key: K): void {
        if (!key) return;
        this.take(key);
    }
    take(key: K): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            this._keys.splice(index, 1);
            return this._values.splice(index, 1)[0];
        }
        return undefined;
    }
    clear(): void {
        this._keys = [];
        this._values = [];
    }
}

export function findAValidValue(array: any[], fromIndex: number = 0, key?: string | number): any {
    if (!array || !array.length) return null;
    for (let i = fromIndex; i < array.length; i++) {
        if (isDefined(key) && isDefined(array[i]) && isDefined(array[i][key])) {
            return array[i][key];
        } else if (isDefined(array[i])) {
            return array[i];
        }
    }
}