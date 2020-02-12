import { isArray } from 'neurons-utils';
import { EventEmitter, IEventEmitter, IEmitter, emitter } from 'neurons-emitter';
import { IHierarchyNode, ChildrenAccessor, defaultChildrenAccessor, HierarchyNode } from './hierarchy';

/**
 * hierarchy collection
 * +----------------------+ 
 * | node -  node -  leaf |
 * |      |       |- leaf |    +--------------------------------------------------+
 * |      |- node -  leaf | => | [node, node, leaf, leaf, node, leaf, leaf, leaf] |
 * |              |- leaf |    +--------------------------------------------------+
 * |              |- leaf |
 * +----------------------+
 * @author AK
 */
export interface IHierarchyCollection {
    onReset: IEmitter<IHierarchyCollection>;
    onRefresh: IEmitter<IHierarchyCollection>;
    
    source(): any;
    source(source): IHierarchyCollection;
    filter(filterFunction: (data) => boolean): IHierarchyCollection;
    flatableList(): IHierarchyNode[];
    destroy();
}

export class HierarchyCollection implements IHierarchyCollection {
    constructor(private _source, private _childrenAccessor: ChildrenAccessor = defaultChildrenAccessor) {
        this._nativeEmitter = new EventEmitter();
        this.onReset = emitter('reset', this._nativeEmitter);
        this.onRefresh = emitter('refresh', this._nativeEmitter);
        this._generate();
    }

    onReset: IEmitter<IHierarchyCollection>;
    onRefresh: IEmitter<IHierarchyCollection>;

    private _nativeEmitter: EventEmitter;
    private _roots: IHierarchyNode[];
    private _filteredRoots: IHierarchyNode[] = [];
    private _list: IHierarchyNode[];
    private _filterFunction;

    source(): any;
    source(source): IHierarchyCollection;
    source(source?) {
        if (arguments.length) {
            this._source = source;
            this._generate();
            this._doFilter();
            this._flatableHierarchyCollection();
            this.onReset.emit(this);
            return this;
        } else {
            return this._source;
        }
    }
    filter(filterFunction: (data) => boolean): IHierarchyCollection {
        this._filterFunction = filterFunction;
        this._doFilter();
        this._flatableHierarchyCollection();
        this.onRefresh.emit(this);
        return this;
    }
    flatableList(): IHierarchyNode[] {
        if (!this._list) {
            this._list = [];
            this._flatableHierarchyCollection();
        }
        return this._list;
    }
    destroy() {
        this._nativeEmitter.off();
    }
    private _generate(): void {
        if (!isArray(this._source) && this._source && this._hasChildren(this._source)) {
            this._roots = [new HierarchyNode(null, this._source, this._childrenAccessor)]
        } else {
            const data = isArray(this._source) ? this._source : [this._source];
            this._roots = data.map(source => new HierarchyNode(null, source, this._childrenAccessor))
        }
    }
    private _hasChildren(data) {
        return !!this._childrenAccessor(data);
    }
    private _flatableHierarchyCollection(): void {
        if (this._list) {
            this._list.length = 0;
            this._filteredRoots.forEach(root => {
                this._collectHierarchyNode(this._list, root);
            })
        }
    }
    private _collectHierarchyNode(list: IHierarchyNode[], node: IHierarchyNode) {
        list.push(node);
        if (!node.isLeaf) {
            node.childNodes().forEach(n => this._collectHierarchyNode(list, n));
        }
    }
    private _doFilter(): void {
        if (this._roots) {
            this._roots.forEach(root => root.filter(this._filterFunction));
            if (!this._filterFunction) {
                this._filteredRoots = this._roots;
            } else {
                this._filteredRoots = this._roots.filter(node => this._filterFunction(node.data))
            }
        }
    }
}
export function create(source, children: ChildrenAccessor = defaultChildrenAccessor): IHierarchyCollection {
    return new HierarchyCollection(source, children);
}