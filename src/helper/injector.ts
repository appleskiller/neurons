import { isDefined } from '../utils/typeutils';

export type ClassLike = any;
export type Instance = any;
export type Factory = (...args) => Instance;

export interface Provider {
    token: any;
    use?: ClassLike | Instance;
    useClass?: ClassLike;
    useFactory?: Factory;
    deps?: ClassLike[];
}

export interface IInjector {
    providers(providers?: Provider[]): void;
    provide(provider: Provider): void;
    create(providers?: Provider[]): IInjector;
    has(token: any): boolean;
    get<T>(token: any): T;
    destroy();
}

export class Injector implements IInjector {
    constructor(providers?: Provider[], public parent?: Injector) {
        this.providers(providers);
    }
    private _dic: Map<any, Provider> = new Map();
    providers(providers?: Provider[]): void {
        providers = providers || [];
        providers.forEach((provider) => {
            this.provide(provider);
        });
    }
    provide(provider: Provider): void {
        if (!provider || !provider.token || (!isDefined(provider.use) && !isDefined(provider.useClass) && !isDefined(provider.useFactory))) return;
        provider.deps = provider.deps || [];
        if (provider.deps.length > 8) {
            throw new Error(`Set up 8 predependency at most.`);
        }
        this._dic.set(provider.token, { ...provider });
    }
    create(providers?: Provider[]): IInjector {
        return new Injector(providers, this);
    }
    has(token: any): boolean {
        return this._dic.has(token);
    }
    get<T>(token: any): T {
        const provider = this.getProvider(token);
        if (provider) {
            // useClass 返回类，否则将返回实例
            if (provider.useClass) {
                return provider.useClass;
            } else if (provider.useFactory) {
                return this._callFactory(provider);
            } else {
                return this._instantiate(provider);
            }
        }
        // 如果token为class，则直接尝试实例化
        if (typeof token === 'function') {
            return new token();
        }
        return undefined;
    }
    destroy() {
        this._dic.clear();
    }
    getProvider(token: any): Provider {
        const provider = this._dic.get(token);
        if (provider) {
            return provider;
        }
        if (this.parent) {
            return this.parent.getProvider(token);
        }
        return null;
    }
    private _instantiate(provider: Provider): any {
        const classOrValue = provider.use;
        const deps = provider.deps || [];
        
        if (typeof classOrValue !== 'function') {
            return classOrValue;
        } else {
            let param, warn = false;
            const params = deps.map((token) => {
                param = this.get(token);
                if (!isDefined(param)) warn = true;
                return param;
            });
            if (warn) {
                console.warn(`There may be instances of failure:`, params);
            }
            switch (deps.length) {
                case 0:
                    return new classOrValue();
                case 1:
                    return new classOrValue(params[0]);
                case 2:
                    return new classOrValue(params[0], params[1]);
                case 3:
                    return new classOrValue(params[0], params[1], params[2]);
                case 4:
                    return new classOrValue(params[0], params[1], params[2], params[3]);
                case 5:
                    return new classOrValue(params[0], params[1], params[2], params[3], params[4]);
                case 6:
                    return new classOrValue(params[0], params[1], params[2], params[3], params[4], params[5]);
                case 7:
                    return new classOrValue(params[0], params[1], params[2], params[3], params[4], params[5], params[6]);
                case 8:
                    return new classOrValue(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
                default:
                    break;
            }
        }
    }
    private _callFactory(provider: Provider): any {
        const factory = provider.useFactory;
        const deps = provider.deps || [];
        
        if (typeof factory !== 'function') {
            return factory;
        } else {
            let param, warn = false;
            const params = deps.map((token) => {
                param = this.get(token);
                if (!isDefined(param)) warn = true;
                return param;
            });
            if (warn) {
                console.warn(`There may be instances of failure:`, params);
            }
            switch (deps.length) {
                case 0:
                    return factory();
                case 1:
                    return factory(params[0]);
                case 2:
                    return factory(params[0], params[1]);
                case 3:
                    return factory(params[0], params[1], params[2]);
                case 4:
                    return factory(params[0], params[1], params[2], params[3]);
                case 5:
                    return factory(params[0], params[1], params[2], params[3], params[4]);
                case 6:
                    return factory(params[0], params[1], params[2], params[3], params[4], params[5]);
                case 7:
                    return factory(params[0], params[1], params[2], params[3], params[4], params[5], params[6]);
                case 8:
                    return factory(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
                default:
                    break;
            }
        }
    }
}

export const injector = new Injector();