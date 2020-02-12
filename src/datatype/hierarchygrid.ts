import { ChildrenAccessor, defaultChildrenAccessor, IHierarchyNode, HierarchyNode, getParents, reduceDescendants, eachBelow, eachBelowReverse } from './hierarchy';
import { isArray, isDefined } from 'neurons-utils';
import { EventEmitter, IEventEmitter, IEmitter, emitter } from 'neurons-emitter';
import { SizeAccessor, defaultSizeAccessor, GridMatrix, IItemChangeEvent, IColChangeEvent, IRowChangeEvent, GridLayoutBox, GridRange } from './gridmatix';

export type IGridNodeBox = {x: number, y: number, width: number, height: number};

export interface IHierarchyGridNode extends IHierarchyNode {
    root: IHierarchyGridNode;
    parent: IHierarchyGridNode;
    leafCount: number;
    nodeSize(): {width: number, height: number};
    isEmpty(): boolean;
    isLastOne(node: IHierarchyGridNode): boolean;
}

export interface IHierarchyGridRoot extends IHierarchyGridNode {
    nodeSize(): {width: number, height: number};
    nodeSize(item): {width: number, height: number};
}

export type IGridItemChangeEvent<T> = {
    colIndex: number,
    rowIndex: number,
    item: T,
    parent: T
}[]

/**
 * hierarchy tree
 * +----------------------------------+ 
 * | +------+    +------+    +------+ |
 * | | node | +- | node | +- | leaf | |
 * | +------+ |  +------+ |  +------+ |
 * |          |           |  +------+ |
 * |          |           +- | leaf | |
 * |          |              +------+ |
 * |          |  +------+    +------+ |
 * |          +- | node | +- | leaf | |
 * |             +------+ |  +------+ |
 * |                      |  +------+ |
 * |                      +- | leaf | |
 * |                      |  +------+ |
 * |                      |  +------+ |
 * |                      +- | leaf | |
 * |                         +------+ |
 * +----------------------------------+
 * @author AK
 */
export interface IHierarchyGrid<T> {
    onReset: IEmitter<IHierarchyGrid<T>>;
    onRowChange: IEmitter<IRowChangeEvent>;
    onColChange: IEmitter<IColChangeEvent>;
    onItemAdded: IEmitter<IGridItemChangeEvent<T>>;
    onItemRemoved: IEmitter<IGridItemChangeEvent<T>>;

    source(): any;
    source(source): IHierarchyGrid<T>;

    add(parent, item): void;
    remove(item): void;
    update(item): void;
    updatePosition(): void;
    
    size(): {width: number, height: number};
    count(): [number, number];
    each(fn: (parent: T, item: T, colIndex, rowIndex) => void, range?: GridRange);
    getParent(item: T): T;
    getParents(item: T): T[];
    getIndex(item: T): [number, number];
    getItemBox(item: T): GridLayoutBox;
    getItemBoxBy(colIndex, rowIndex): GridLayoutBox;
    getItem(colIndex, rowIndex): T;
    getRowBox(rowIndex): GridLayoutBox;
    getColBox(colIndex): GridLayoutBox;

    destroy();
}

export class HierarchyGridNode extends HierarchyNode implements IHierarchyGridNode {
    constructor(
        parent: IHierarchyNode,
        data: any,
        children: ChildrenAccessor = defaultChildrenAccessor,
    ) {
        super(parent, data, children);
        // 计算叶子节点数量
        this.leafCount = 0;
        reduceDescendants(this.childNodes(), (previous, n: IHierarchyGridNode, index) => {
            if (previous === undefined) {
                n.parent && (n.parent.leafCount = (n.leafCount || 1));
                return n.leafCount || 1;
            } else {
                previous = (n.leafCount || 1) + previous;
                n.parent && (n.parent.leafCount = previous);
                return previous;
            }
        });
    }
    root: IHierarchyGridRoot;
    parent: IHierarchyGridNode;
    leafCount: number;

    nodeSize(): {width: number, height: number} {
        return this.root.nodeSize(this.data);
    }
    isEmpty(): boolean {
        return !this._childNodes.length;
    }
    isLastOne(node: IHierarchyGridNode): boolean {
        return this._childNodes.length === 1 && this._childNodes[0] === node;
    }
    addNode(node: IHierarchyGridNode): boolean {
        const firstAdd = !this._childNodes.length;
        if (super.addNode(node)) {
            let amount = node.leafCount || 1;
            this.leafCount += amount;
            // 调整叶子数量
            amount = firstAdd ? (amount - 1) : amount;
            const parents = getParents(this) as IHierarchyGridNode[];
            parents.forEach(parent => {
                parent.leafCount += amount;
            })
            return true;
        }
        return false;
    }
    removeNode(node: IHierarchyGridNode): boolean {
        if (super.removeNode(node)) {
            const lastRemove = !this._childNodes.length;
            let amount = node.leafCount || 1;
            this.leafCount -= amount;
            // 调整叶子数量
            amount = lastRemove ? (amount - 1) : amount;
            const parents = getParents(this) as IHierarchyGridNode[];
            parents.forEach(parent => {
                parent.leafCount -= amount;
            })
        }
        return false;
    }
    protected _createNode(item) {
        return new HierarchyGridNode(this, item, this._childrenAccessor);
    }
}

export class HierarchyGridRoot<T> extends HierarchyGridNode implements IHierarchyGridRoot {
    constructor(
        parent: IHierarchyGridNode,
        data: any,
        children: ChildrenAccessor = defaultChildrenAccessor,
        private _nodeSize: SizeAccessor<T> = defaultSizeAccessor,
    ) {
        super(parent, data, children);
    }
    protected _nativeEmitter: EventEmitter = new EventEmitter();

    nodeSize(): {width: number, height: number};
    nodeSize(item: T): {width: number, height: number};
    nodeSize(item?: T): {width: number, height: number} {
        item = arguments.length ? item : this.data;
        return this._nodeSize(item);
    }

    protected _createNode(item) {
        return new HierarchyGridNode(this, item, this._childrenAccessor);
    }
}

export class HierarchyGrid<T> implements IHierarchyGrid<T> {
    constructor(
        private _source,
        private _childrenAccessor: ChildrenAccessor = defaultChildrenAccessor,
        private _nodeSizeAccessor: SizeAccessor<T> = defaultSizeAccessor,
    ) {
        this._generate();
    }
    private _nativeEmitter: EventEmitter = new EventEmitter();

    onReset = emitter<IHierarchyGrid<T>>('reset', this._nativeEmitter);
    onRowChange: IEmitter<IRowChangeEvent> = emitter('row_change', this._nativeEmitter);
    onColChange: IEmitter<IColChangeEvent> = emitter('col_change', this._nativeEmitter);
    onItemAdded: IEmitter<IGridItemChangeEvent<T>> = emitter('item_added', this._nativeEmitter);
    onItemRemoved: IEmitter<IGridItemChangeEvent<T>> = emitter('item_removed', this._nativeEmitter);

    private _matrix: GridMatrix<IHierarchyGridNode>;
    private _roots: IHierarchyGridRoot[] = [];
    private _map: Map<T, IHierarchyGridNode> = new Map();
    source(): any;
    source(source): IHierarchyGrid<T>;
    source(source?) {
        if (arguments.length) {
            this._source = source;
            this._generate();
            this.onReset.emit(this);
            return this;
        } else {
            return this._source;
        }
    }

    add(parent: T, item: T): void {
        const parentNode = parent ? this._map.get(parent) : null;
        const itemNode = this._map.has(item) ? this._map.get(item) : null;
        if (itemNode) {
            if (!parentNode) {
                if (!!itemNode.parent) {
                    this._removeNode(itemNode);
                }
                this._addRootNode(itemNode);
            } else {
                if (itemNode.parent !== parentNode) {
                    this._removeNode(itemNode);
                    this._addNode(parentNode, itemNode);
                } else {
                    // nothing to do
                }
            }
        } else {
            if (!parentNode) {
                this._addRoot(item);
            } else {
                this._add(parentNode, item);
            }
        }
    }
    remove(item: T): void {
        if (this._map.has(item)) {
            const itemNode = this._map.get(item);
            this._removeNode(itemNode);
        }
    }
    update(item): void {
        const itemNode = this._map.get(item);
        if (itemNode) {
            this._matrix.update(itemNode);
        }
    }
    updatePosition() {
        this._matrix.updatePosition();
    }
    size(): {width: number, height: number} {
        return this._matrix.size();
    }
    count(): [number, number] {
        return this._matrix.count();
    }
    each(fn: (parent: T, item: T, colIndex, rowIndex) => void, range?: GridRange) {
        const size = this._matrix.count();
        range = range || {x: 0, y: 0, width: size[0], height: size[1]};
        this._matrix.eachCells(range, (item: IHierarchyGridNode, colIndex, rowIndex) => {
            item && fn((item.parent ? item.parent.data : undefined), item.data, colIndex, rowIndex);
        });
    }
    getParent(item: T): T {
        const node = this._map.get(item);
        return node && node.parent ? node.parent.data : undefined;
    }
    getParents(item: T): T[] {
        const node = this._map.get(item);
        return node && node.parent ? getParents(node).map(n => n.data) : [];
    }
    getIndex(item: T): [number, number] {
        const node = this._map.get(item);
        return node ? this._matrix.index(node) : undefined;
    }
    getItemBox(item: T): GridLayoutBox {
        const index = this._map.get(item);
        return index ? this._matrix.getItemBox(index[0], index[1]) : undefined;
    }
    getItemBoxBy(colIndex, rowIndex): GridLayoutBox {
        return this._matrix.getItemBox(colIndex, rowIndex);
    }
    getItem(colIndex, rowIndex): T {
        const node = this._matrix.get(colIndex, rowIndex);
        return node ? node.data : undefined;
    }
    getRowBox(rowIndex): GridLayoutBox {
        return this._matrix.getRowBox(rowIndex);
    }
    getColBox(colIndex): GridLayoutBox {
        return this._matrix.getColBox(colIndex);
    }
    destroy() {
        this._nativeEmitter.off();
        this._matrix.destroy();
    }
    private _addRootNode(node: IHierarchyGridNode) {
        const colIndex = 0;
        const rowIndex = this._roots.reduce((p, c) => p + (c.leafCount || 1), 0);
        this._putIntoMatrix(colIndex, rowIndex, node);
        this._roots.push(node);
    }
    private _addRoot(item: T) {
        const root = new HierarchyGridRoot(null, item, this._childrenAccessor, this._nodeSizeAccessor);
        this._addRootNode(root);
    }
    private _addNode(parent: IHierarchyGridNode, node: IHierarchyGridNode) {
        const index = this._matrix.index(parent);
        const colIndex = index[0] + 1;
        // 在add之前计算rowIndex，保证在插入第一个孩子时能够与parent保持同行
        const rowIndex = index[1] + parent.leafCount;
        const firstAdd = parent.isEmpty();
        let amount = node.leafCount || 1;
        amount = firstAdd ? amount - 1 : amount;
        if (amount > 0) {
            // 倒序执行兄弟节点下移
            eachBelowReverse(this._roots, parent, (brother) => {
                const brotherIndex = this._matrix.index(brother);
                this._eachReverse(brother, brotherIndex[0], brotherIndex[1], (col, row, n) => {
                    this._matrix.move(n, col, row + amount);
                });
            });
        }
        parent.addNode(node);
        this._putIntoMatrix(colIndex, rowIndex, node);
    }
    private _add(parent: IHierarchyGridNode, item: T) {
        const node = new HierarchyGridNode(parent, item, this._childrenAccessor);
        this._addNode(parent, node);
    }
    private _removeNode(node: IHierarchyGridNode) {
        const index = this._matrix.index(node);
        if (index) {
            this._deleteFromMatrix(index[0], index[1], node);
            // 兄弟节点上移
            const lastRemove = node.parent ? node.parent.isLastOne(node) : (this._roots.length === 1 && this._roots[0] === node);
            let amount = node.leafCount || 1;
            eachBelow(this._roots, node, (brother) => {
                // 如果移除的是最后一个节点，那么相对于祖籍的兄弟节点实际调整应该为amount - 1;
                const offset = brother.parent === node.parent ? amount : (lastRemove ? (amount - 1) : amount);
                if (offset > 0) {
                    const brotherIndex = this._matrix.index(brother);
                    this._eachForward(brother, brotherIndex[0], brotherIndex[1], (col, row, n) => {
                        this._matrix.move(n, col, row - offset);
                    });
                }
            });
            // 移除尾部空行
            this._matrix.trimBelow();
            this._matrix.trimRight();
        }
        if (node.parent) {
            node.parent.removeNode(node);
        } else {
            const i = this._roots.indexOf(node);
            if (i !== -1) {
                this._roots.splice(i, 1);
            }
        }
    }
    private _generate() {
        if (!isArray(this._source) && this._source && this._hasChildren(this._source)) {
            this._roots = [new HierarchyGridRoot(null, this._source, this._childrenAccessor, this._nodeSizeAccessor)]
        } else if (this._source) {
            const data = isArray(this._source) ? this._source : [this._source];
            this._roots = data.map(source => new HierarchyGridRoot(null, source, this._childrenAccessor, this._nodeSizeAccessor))
        } else {
            this._roots = [];
        }
        this._matrix && this._matrix.destroy();
        this._matrix = new GridMatrix<IHierarchyGridNode>({
            width: 128,
            height: 36,
        }, (node) => {
            return node.nodeSize();
        }, (node) => node.id);
        // 初始化
        let rowIndex = 0, colIndex = 0;
        this._roots.forEach(root => {
            this._putIntoMatrix(colIndex, rowIndex, root);
            rowIndex += (root.leafCount || 1);
        });
        // 处理变更
        this._matrix.onItemRemoved.listen((items: IItemChangeEvent<IHierarchyGridNode>) => {
            this.onItemRemoved.emit(items.map(item => {
                return {colIndex: item.colIndex, rowIndex: item.rowIndex, item: item.item.data, parent: item.item.parent ? item.item.parent.data : null}
            }));
        })
        this._matrix.onItemAdded.listen((items: IItemChangeEvent<IHierarchyGridNode>) => {
            this.onItemAdded.emit(items.map(item => {
                return {colIndex: item.colIndex, rowIndex: item.rowIndex, item: item.item.data, parent: item.item.parent ? item.item.parent.data : null}
            }));
        })
        this._matrix.onColChange.listen(e => this.onColChange.emit(e))
        this._matrix.onRowChange.listen(e => this.onRowChange.emit(e))
    }
    private _putIntoMatrix(colIndex, rowIndex, node) {
        this._eachForward(node, colIndex, rowIndex, (col, row, n) => {
            this._matrix.put(col, row, n);
            this._map.set(n.data, n);
        });
    }
    private _deleteFromMatrix(colIndex, rowIndex, node) {
        this._eachForward(node, colIndex, rowIndex, (col, row, n) => {
            this._matrix.remove(n);
            this._map.delete(n.data);
        });
    }
    /**
     * Eachs forward 正向遍历。先访问父节点然后访问子节点
     */
    private _eachForward(node, col, row, fn) {
        const oriCol = col;
        fn(col, row, node);
        const nodes = node.childNodes();
        nodes.forEach((n: IHierarchyGridNode) => {
            this._eachForward(n, col + 1, row, fn);
            row += (n.leafCount || 1);
        });
        col = oriCol;
    }
    /**
     * Eachs forward 逆向遍历。先访问父节点然后访问子节点
     */
    private _eachReverse(node, col, row, fn) {
        const oriCol = col;
        const nodes = node.childNodes();
        row += Math.max(0, node.leafCount - 1);
        for (let i = nodes.length - 1; i >= 0; i--) {
            this._eachReverse(nodes[i], col + 1, row, fn);
            if (i === 0) {
                row -= Math.max(0, nodes[i].leafCount - 1);
            } else {
                row -= (nodes[i].leafCount || 1);
            }
        }
        fn(col, row, node);
        col = oriCol;
    }
    private _hasChildren(data) {
        return !!this._childrenAccessor(data);
    }
}

export function create<T>(
    source,
    children: ChildrenAccessor = defaultChildrenAccessor,
    nodeSize: SizeAccessor<T> = defaultSizeAccessor
): IHierarchyGrid<T> {
    return new HierarchyGrid(source, children, nodeSize);
}
