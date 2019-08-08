import { isDefined, isEmpty } from '../utils/typeutils';
import { uniqueId } from '../utils/objectutils';

/* tslint:disable */
// --------------------------------------------------
// 向Backbone的原作者致敬：http://backbonejs.org
// ==================================================

export interface IEventEmitter {
    on(name: string, callback?: any, context?: any, priority?: number): IEventEmitter;
    once(name: string, callback?: any, context?: any, priority?: number): IEventEmitter;
    off(name?: string, callback?: any, context?: any): IEventEmitter;
    emit(name: string, ...args): IEventEmitter;
    listenTo(obj: IEventEmitter, name: string, callback?: any, priority?: number): IEventEmitter;
    listenToOnce(obj: IEventEmitter, name: string, callback?: any, priority?: number): IEventEmitter;
    stopListening(obj?: IEventEmitter, name?: string, callback?: any): IEventEmitter;
    hasListener(name: string, context?: any): boolean;
}

var emitEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
        case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
        case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
        case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
        case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
        default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
};

export type IEmitterOffHandler = () => void;

export interface IEmitter<T> {
    emit(value?: T, ...args): void;
    hasListener(): boolean;
    listen(handler: (event: T, ...args) => void, context?: any, priority?: number): IEmitterOffHandler;
}

/**
 * EventEmitter类相对于其他事件类增加了priority参数以及hasListener方法。
 * priority用于控制调用优先级
 * hasListener用于检查是否注册了监听器
 */
export class EventEmitter implements IEventEmitter {
    /**
     * 绑定指定事件到一个处理函数；
     * 对于特殊的“all”类型的事件处理函数，任何事件发生都会被触发
     * 越高优先级的监听器越先被处理
     */
    on(name: string, callback?: any, context?: any, priority?: number): IEventEmitter {
        if (!name || !callback) return this;
        this['__events'] || (this['__events'] = {});
        var events = this['__events'][name] || (this['__events'][name] = []);
        priority = isDefined(priority) ? priority : 0;
        var item = {callback: callback, context: context, priority: priority, ctx: context || this};
        if (events.length) {
            for (var i: number = events.length - 1; i >=0 ; i--) {
                if (events[i].priority >= item.priority) {
                    events.splice(i+1 , 0 , item);
                    break;
                }
            }
        } else {
            events.push(item);
        }
        return this;
    }
    /**
     * 一次性的绑定指定事件到一个处理函数；
     * 一旦事件被处理就立刻被移除。
     * 越高优先级的监听器越先被处理
     */
    once(name: string, callback?: any, context?: any, priority?: number): IEventEmitter {
        if (!name || !callback) return this;
        var self = this;
        var once: any = function () {
            self.off(name, once);
            callback.apply(this, arguments);
        }
        once.__callback = callback;
        return this.on(name, once, context, priority);
    }
    /**
     * 移除一个或多个响应函数。
     * 此函数具有两种函数签名
     */
    off(name?: string, callback?: any, context?: any): IEventEmitter {
        if (!this['__events']) return this;
        if (!name && !callback && !context) {
            this['__events'] = void 0;
            return this;
        }

        var names = name ? [name] : Object.keys(this['__events']);
        for (var i = 0, length = names.length; i < length; i++) {
            name = names[i];

            var events = this['__events'][name];
            if (!events) continue;

            if (!callback && !context) {
                delete this['__events'][name];
                continue;
            }

            var remaining = [];
            for (var j = 0, k = events.length; j < k; j++) {
                var event = events[j];
                if (
                    callback && callback !== event.callback &&
                    callback !== event.callback.__callback ||
                    context && context !== event.context
                ) {
                    remaining.push(event);
                }
            }

            if (remaining.length) {
                this['__events'][name] = remaining;
            } else {
                delete this['__events'][name];
            }
        }

        return this;
    }
    /**
     * 派发指定事件
     */
    emit(name: string, ...args): IEventEmitter {
        if (!this['__events'] || !name) return this;
        var events = this['__events'][name];
        var allEvents = this['__events']["all"];
        if (events) emitEvents(events, args);
        if (allEvents) emitEvents(allEvents, args);
        return this;
    }

    /**
     * 监听指定对象的特定事件。
     */
    listenTo(obj: IEventEmitter, name: string, callback?: any, priority?: number): IEventEmitter {
        var listeningTo = this['_listeningTo'] || (this['_listeningTo'] = {});
        var id = obj['__listenId'] || (obj['__listenId'] = uniqueId('l'));
        listeningTo[id] = obj;
        obj.on(name, callback, this , priority);
        return this;
    }

    /**
     * 一次性的监听指定对象的特定事件。
     * 一旦事件被处理就立刻被移除。
     */
    listenToOnce(obj: IEventEmitter, name: string, callback?: any, priority?: number): IEventEmitter {
        if (!callback) return this;
        var self = this;
        var once: any = function () {
            self.stopListening(obj, name, once);
            callback.apply(this, arguments);
        }
        once.__callback = callback;
        return this.listenTo(obj, name, once, priority);
    }
    /**
     * 取消指定对象的特定事件监听
     */
    stopListening(obj?: IEventEmitter, name?: string, callback?: any): IEventEmitter {
        var listeningTo = this['_listeningTo'];
        if (!listeningTo) return this;
        var remove = !name && !callback;
        if (!callback && typeof name === 'object') callback = this;
        if (obj) (listeningTo = {})[obj['__listenId']] = obj;
        for (var id in listeningTo) {
            obj = listeningTo[id];
            obj.off(name, callback, this);
            if (remove || isEmpty(obj['__events'])) delete this['_listeningTo'][id];
        }
        return this;
    }
    /**
     * 检查指定事件是否有任何处理函数。
     */
    hasListener(name: string, context?: any): boolean {
        if (!this['__events']) return false;
        if (!name && !context) return false;

        var names = name ? [name] : Object.keys(this['__events']);
        for (var i = 0, length = names.length; i < length; i++) {
            name = names[i];
            var events = this['__events'][name];
            if (!events) continue;
            if (!context) return true;
            for (var j = 0, k = events.length; j < k; j++) {
                if (context === events[j].context) {
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * 将IEventEmitter的核心事件函数mixin到指定对象原型上，以使指定对象具有事件处理能力。
 */
export function eventful(proto: any): any {
    if (!proto) return proto;
    if (typeof proto === 'function'){
        proto = proto.prototype;
    }
    Object.assign(proto, EventEmitter.prototype);
    return proto;
}
export function emitter<T>(eventName: string, nativeEmitter?: IEventEmitter): IEmitter<T> {
    nativeEmitter = nativeEmitter || new EventEmitter();
    const emitter = {
        emit: (event: T, ...args) => {
            nativeEmitter.emit.apply(nativeEmitter, [eventName, event].concat(args));
        },
        listen: (handler: (event: T, ...args) => void, context?: any, priority?: number) => {
            if (!handler) return () => {};
            const off = () => {
                nativeEmitter.off(eventName, handler, context);
            }
            nativeEmitter.on(eventName, handler, context, priority);
            return off;
        },
        hasListener: () => {
            return nativeEmitter.hasListener(eventName);
        },
    }
    return emitter;
}