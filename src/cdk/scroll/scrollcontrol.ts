import { addEventListener, getClientSize, getScrollSize } from 'neurons-dom';
import { RemoveEventListenerFunction } from '../../binding/common/domapi';

export interface IScrollEvent {
    isOnTop: boolean;
    isOnBottom: boolean;
    isOnLeft: boolean;
    isOnRight: boolean;
    position: [number, number];
    distance: [number, number];
    duration: number;
    oriEvent: Event;
}

export type IScrollCallback = (e: IScrollEvent) => void;

function wrapScrollEvent(scrollEvent: Event, previous, current, previousTime): IScrollEvent {
    const currentTime = (new Date()).getTime();
    let duration = currentTime - previousTime;
    // 避免出现0的情况
    duration = duration || 0.001;
    // 间隔周期过长意味着之前是空闲的状态
    duration = duration >= 60 ? 0.001 : duration;
    return {
        position: current,
        distance: [current[0] - previous[0], current[1] - previous[1]],
        duration: duration,
        oriEvent: scrollEvent,
        isOnTop: false,
        isOnBottom: false,
        isOnLeft: false,
        isOnRight: false,
    }
}

function measureScroll(scrollContainer: HTMLElement) {
    const size = getClientSize(scrollContainer);
    const scrollSize = getScrollSize(scrollContainer);
    const scrollTop = scrollContainer.scrollTop;
    const scrollLeft = scrollContainer.scrollLeft;
    const current = [scrollLeft, scrollTop];
    const bufferDistance = 24;
    return {
        isOnLeft: current[0] - bufferDistance <= 0,
        isOnRight: (scrollLeft + size.width + bufferDistance >= scrollSize.width),
        isOnTop: current[1] - bufferDistance <= 0,
        isOnBottom: (scrollTop + size.height + bufferDistance >= scrollSize.height),
    }
}

function calculateScroll(scrollContainer: HTMLElement, scrollEvent: Event, callback: IScrollCallback, previous, previousTime) {
    if (!callback) return;
    const size = getClientSize(scrollContainer);
    const scrollSize = getScrollSize(scrollContainer);
    const scrollTop = scrollContainer.scrollTop;
    const scrollLeft = scrollContainer.scrollLeft;
    let current = [scrollLeft, scrollTop];
    const event = wrapScrollEvent(null, previous, current, previousTime);
    const bufferDistance = 24;
    event.isOnLeft = current[0] - bufferDistance <= 0;
    event.isOnRight = (scrollLeft + size.width + bufferDistance >= scrollSize.width);
    event.isOnTop = current[1] - bufferDistance <= 0;
    event.isOnBottom = (scrollTop + size.height + bufferDistance >= scrollSize.height);
    callback(event);
}

export const scrollController = {
    onScroll: (scrollContainer: HTMLElement, callback: IScrollCallback): RemoveEventListenerFunction => {
        if (!callback) return () => {};
        let previous = [scrollContainer.scrollLeft, scrollContainer.scrollTop];
        let previousTime = (new Date()).getTime();
        calculateScroll(scrollContainer, null, callback, previous, previousTime);
        return addEventListener(scrollContainer, 'scroll', (e) => {
            calculateScroll(scrollContainer, null, callback, previous, previousTime);
            previousTime = (new Date()).getTime();
        });
    },
    measureScroll: measureScroll,
}
