import { INeBindingRef, IInvokeDetectChangeFunction } from '../common/interfaces';
import { Map } from 'neurons-utils';

// 变更检测 TODO

// setState
// -> 变更检测
// -> 检查变更更新实例
// -> 执行绑定函数
// -> 回调Hook
// -> 上浮变更（由输出或双向绑定产生）
// -> 标记顶级变更检测
// -> 执行子组件变更检测

// NeBindingRef 发起setState 并引起执行绑定 由子组件NeElement采集变化但阻止继续调用setState等待执行变更检测

export interface IDetectChangeNode {
    ref: INeBindingRef;
}

let roots: INeBindingRef[] = [];
let isDetecting = false;
let isCollecting = false;
let currentFlowId = 0;
let detectingFlowId;

function getParentStack(ref: INeBindingRef, stack?: INeBindingRef[]): INeBindingRef[] {
    stack = stack || [];
    const parent: INeBindingRef = ref.parent();
    if (parent) {
        stack.push(parent);
        return getParentStack(parent, stack);
    }
    return stack;
}
function isRoot(ref: INeBindingRef): boolean {
    return roots.indexOf(ref) !== -1;
}
function cancel(ref: INeBindingRef) {
    const index = roots.indexOf(ref);
    if (index !== -1) {
        roots.splice(index, 1);
    }
}
function put(ref: INeBindingRef) {
    const parents = getParentStack(ref);
    let index;
    // 无根
    if (!parents.length) {
        !isRoot(ref) && roots.push(ref);
    } else {
        for (var i: number = parents.length - 1; i >=0 ; i--) {
            if (isRoot(parents[i])) {
                for (var j: number = i - 1; j >=0 ; j--) {
                    cancel(parents[j]);
                }
                return;
            }
        }
        roots.push(ref);
    }
}

function invokeDetectChange(flowId: number) {
    if (detectingFlowId !== flowId) return;
    isDetecting = true;
    const copy = roots;
    roots = [];
    copy.forEach(ref => ref.detectChanges());
    isDetecting = false;
    isCollecting = false;
}

export function markChangeDetection(ref: INeBindingRef): IInvokeDetectChangeFunction {
    currentFlowId += 1;
    const flowId = currentFlowId;
    const result = function () { invokeDetectChange(flowId) };
    // 如果正在检测中，则不再记录ref
    if (isDetecting) return result;
    put(ref);
    // 如果已经开始采集，则直接返回新的id
    if (isCollecting) return result
    isCollecting = true;
    detectingFlowId = currentFlowId;
    return result;
}

export function cancelChangeDetection(ref: INeBindingRef) {
    cancel(ref);
}