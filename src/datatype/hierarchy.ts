import { uniqueId } from 'neurons-utils';
import { EventEmitter } from 'neurons-emitter';

export interface IHierarchyNode {
    id: string;
    root: IHierarchyNode;
    parent: IHierarchyNode;
    depth: number;
    isRoot: boolean;
    isLeaf: boolean;
    data: any;

    add(item): IHierarchyNode;
    addNode(node: IHierarchyNode): boolean;
    removeNode(node: IHierarchyNode): boolean;
    switchParent(newParent: IHierarchyNode, node: IHierarchyNode);

    filter(filterFunction: (data) => boolean);
    childNodes?: () => IHierarchyNode[];
    children?: () => any[];
}

export type ChildrenAccessor = (data: any) => any[];

export const CHILDREN_FIELD = 'children';

export function defaultChildrenAccessor(data: any) {
    return this.data && (CHILDREN_FIELD in (data as any)) ? data[CHILDREN_FIELD] : null;
}

export function getParents(node: IHierarchyNode): IHierarchyNode[] {
    let result = [];
    if (!node.parent) return result;
    result.push(node.parent);
    result = result.concat(getParents(node.parent));
    return result;
}
/**
 * 遍历所有后代节点（优先访问后代节点）。
 * @author AK
 * @param node
 * @param fn 
 */
export function eachDescendants(node: IHierarchyNode, fn): void {
    const childNodes = node.childNodes();
    childNodes.forEach(n => eachDescendants(node, fn));
    fn(node);
}
/**
 * 以指定位置为起点，遍历倒序遍历所有上方的兄弟节点及父节点上方的的兄弟节点直到根
 * @author AK
 * @param node
 * @param fn 
 */
export function eachAbove(roots: IHierarchyNode[], node, fn): void {
    const parent = node.parent;
    const siblings = parent ? parent.childNodes() : roots;
    const index = siblings.indexOf(node);
    for (let i = index - 1; i >= 0; i--) {
        fn(siblings[i]);
    }
    if (parent) {
        eachAbove(roots, parent, fn);
    }
}
/**
 * 以指定位置为起点，正序遍历所有下方的兄弟节点及父节点下方的的兄弟节点直到根
 * @author AK
 * @param node
 * @param fn 
 */
export function eachBelow(roots: IHierarchyNode[], node, fn): void {
    const parent = node.parent;
    const siblings = parent ? parent.childNodes() : roots;
    const index = siblings.indexOf(node);
    for (let i = index + 1; i < siblings.length; i++) {
        fn(siblings[i]);
    }
    if (parent) {
        eachBelow(roots, parent, fn);
    }
}
/**
 * 以根为起点，倒序遍历所有下方的兄弟节点及父节点下方的的兄弟节点直到指定位置
 * @author AK
 * @param node
 * @param fn 
 */
export function eachBelowReverse(roots: IHierarchyNode[], node, fn): void {
    const paths = node.parent ? getParents(node).reverse() : [];
    paths.push(node);
    let siblings = roots;
    paths.forEach(n => {
        const index = siblings.indexOf(n);
        for (let i = siblings.length - 1; i > index; i--) {
            fn(siblings[i]);
        }
        siblings = n.childNodes();
    })
}

/**
 * 遍历计算所有后代节点（优先访问后代节点）。
 * @author AK
 * @param node
 * @param fn 
 */
export function reduceDescendants(childNodes: IHierarchyNode[], fn: (previous, current, index) => any): void {
    let previousValue;
    childNodes.forEach((node, index) => {
        if (!node.isLeaf) {
            reduceDescendants(node.childNodes(), fn);
        }
        previousValue = fn(previousValue, node, index);
    });
}

export function getRowCount(node: IHierarchyNode): number {
    if (node.isLeaf) return 1;
    const nodes = node.childNodes();
    if (!nodes.length) return 1;
    let count = 0;
    nodes.forEach((n: IHierarchyNode) => {
        count += getRowCount(n);
    });
    return count;
}
export function getColumnCount(node: IHierarchyNode): number {
    let count = 1;
    if (node.isLeaf) return count;
    node.childNodes().forEach((n: IHierarchyNode) => {
        count = Math.max(getColumnCount(n), count);
    });
    return count;
}

export function getRowIndex(roots: IHierarchyNode[], node: IHierarchyNode): number {
    let result = 0;
    eachAbove(roots, node, () => {
        result += getRowCount(node as IHierarchyNode);
    });
    return result;
}

export function getColumnIndex(node): number {
    return getParents(node).length;
}

export class HierarchyNode implements IHierarchyNode {
    constructor(
        public parent: IHierarchyNode,
        public data: any,
        protected _childrenAccessor: ChildrenAccessor = defaultChildrenAccessor,
    ) {
        this.id = uniqueId('hierarchy_node');
        if (!this.parent) {
            this.root = null;
            this.depth = 0;
            this.isRoot = true;
        } else {
            this.root = this.parent.root || this.parent;
            this.depth = this.parent.depth + 1;
            this.isRoot = false;
        }
        const children = this._childrenAccessor(this.data);
        this.isLeaf = !children;
    }
    id: string;
    root: IHierarchyNode;
    depth: number;
    isRoot: boolean;
    isLeaf: boolean;
    
    protected _childNodes: IHierarchyNode[];
    protected _filteredChildNodes: IHierarchyNode[] = [];
    private _filterFunction: (data) => boolean;
    children(): any[] {
        return this._childrenAccessor(this.data);
    };
    childNodes(): IHierarchyNode[] {
        if (!this._childNodes) {
            this._childNodes = this._createChildNodes();
            // 如果过滤函数存在，则执行过滤
            if (this._filterFunction) {
                this._childNodes.forEach(node => {
                    node.filter(this._filterFunction);
                });
            }
            this._doFilter();
        }
        return this._filteredChildNodes;
    }
    filter(filterFunction: (data) => boolean) {
        this._filterFunction = filterFunction;
        // 如果已经解析了子节点，则执行过滤
        this._childNodes && this._childNodes.forEach(node => {
            node.filter(filterFunction);
        });
        this._doFilter();
    }
    add(item): IHierarchyNode {
        const node = this._createNode(item);
        this.addNode(node);
        return node;
    }
    addNode(node: IHierarchyNode): boolean {
        let index = this._childNodes.indexOf(node);
        if (index !== -1) return false;
        this._childNodes.push(node);
        this.isLeaf = false;
        node.parent = this;
        node.root = this.root || this;
        const childNodes = this.childNodes();
        index = childNodes.indexOf(node);
        if (index === -1 && this._filterFunction && this._filterFunction(node)) {
            childNodes.push(node);
        }
        // TODO node.root !== this.root
        return true;
    }
    removeNode(node: IHierarchyNode): boolean {
        let index = this._childNodes.indexOf(node);
        if (index === -1) return false;
        this._childNodes.splice(index, 1);
        this.isLeaf = !this._childNodes.length;
        const childNodes = this.childNodes();
        index = childNodes.indexOf(node);
        if (index !== -1) {
            childNodes.splice(index, 1);
        }
        // TODO node.root !== this.root
        return true;
    }
    switchParent(newParent: IHierarchyNode): void {
        if (this.parent) {
            this.parent.removeNode(this);
        }
        newParent.addNode(this);
        // TODO node.root !== this.root
    }
    protected _createNode(item) {
        return new HierarchyNode(this, item, this._childrenAccessor);
    }
    private _createChildNodes(): IHierarchyNode[] {
        const children = this.children() || [];
        return children.map(data => this._createNode(data))
    }
    private _doFilter(): void {
        if (this._childNodes) {
            if (!this._filterFunction) {
                this._filteredChildNodes = this._childNodes;
            } else {
                this._filteredChildNodes = this._childNodes.filter(node => this._filterFunction(node.data))
            }
        }
    }
}

export function isHierarchyNode(item): boolean {
    return item instanceof HierarchyNode;
}