import { isArray, isDefined } from '../utils/typeutils';
import { EventEmitter, emitter, IEmitter } from '../helper/emitter';

export type GridLayoutBox = {x: number, y: number, width: number, height: number};
export type GridRange = {x: number, y: number, width: number, height: number};
export type SizeAccessor<T> = (item: T) => {width: number, height: number};
export const defaultSizeAccessor = (): {width: number, height: number} => {
    return {width: 1, height: 1};
};
const defaultMinGridSize = defaultSizeAccessor();

export interface IRowChangeEvent {
    type: 'add' | 'remove' | 'resize' | 'position';
    range: [number, number];
}
export interface IColChangeEvent {
    type: 'add' | 'remove' | 'resize' | 'position';
    range: [number, number];
}
export type IItemChangeEvent<T> = {colIndex: number, rowIndex: number, item: T}[]

/**
 * Grid matrix 栅格矩阵。
 * 类似表格，矩阵中同行元素或同列元素具有相同的尺寸，决定于同行或同列元素的最大尺寸。对于没有元素的cell以undefined作为占位值。
 * 一旦操作通过调用update接口更新行列元素偏移和尺寸变更。
 * @author AK
 */
export class GridMatrix<T> {
    constructor(private _minGridSize = defaultMinGridSize, private _size: SizeAccessor<T> = defaultSizeAccessor, private _id?: (item: T) => string) {
        if (this._id) {
            this._itemToRow = {};
        } else {
            this._itemToRow = new Map();
        }
    }
    private _nativeEmitter = new EventEmitter();
    onRowChange: IEmitter<IRowChangeEvent> = emitter('row_change', this._nativeEmitter);
    onColChange: IEmitter<IColChangeEvent> = emitter('col_change', this._nativeEmitter);
    onItemAdded: IEmitter<IItemChangeEvent<T>> = emitter('item_added', this._nativeEmitter);
    onItemRemoved: IEmitter<IItemChangeEvent<T>> = emitter('item_removed', this._nativeEmitter);

    private _rows: T[][] = [];
    // [[oy1, h1], [oy2, h2]];
    private _rowSizes = [];
    // [[ox1, w1], [ox2, w2]];
    private _colSizes = [];
    private _dirtyIndex = {colIndex: -1, rowIndex: -1};
    private _gridSize = {width: 0, height: 0};
    private _indexSize = {colCount: 0, rowCount: 0};
    private _itemToRow;
    destroy() {
        this._nativeEmitter.off();
    }
    appendRow() {
        const rowIndex = this._indexSize.rowCount;
        this._insertRow(rowIndex);
        this._emitRowChange('add', [rowIndex, rowIndex]);
    }
    appendCol() {
        const colIndex = this._indexSize.colCount;
        this._insertCol(colIndex);
        this._emitColChange('add', [colIndex, colIndex]);
    }
    insertRow(rowIndex) {
        if (rowIndex !== -1) {
            const rows = [];
            if (rowIndex >= this._indexSize.rowCount) {
                for (let i = this._indexSize.rowCount; i <= rowIndex; i++) {
                    this._insertRow(i);
                    rows.push(i);
                }
            } else {
                this._insertRow(rowIndex);
                rows.push(rowIndex);
            }
            const start = rows[0];
            const end = rows[rows.length - 1];
            this._emitRowChange('add', [start, end]);
        }
    }
    insertColumn(colIndex) {
        if (colIndex !== -1) {
            const cols = [];
            if (colIndex >= this._indexSize.colCount) {
                for (let i = this._indexSize.colCount; i <= colIndex; i++) {
                    this._insertCol(i);
                    cols.push(i);
                }
            } else {
                this._insertCol(colIndex);
                cols.push(colIndex);
            }
            const start = cols[0];
            const end = cols[cols.length - 1];
            this._emitColChange('add', [start, end]);
        }
    }
    removeRow(rowIndex) {
        if (rowIndex > 0 && rowIndex < this._indexSize.rowCount) {
            const removes = [];
            this.eachRowCells(rowIndex, (item, index) => {
                if (item) {
                    this._deleteItemToRow(item);
                    removes.push({colIndex: index, rowIndex: rowIndex, item: item})
                }
            })
            this._removeRow(rowIndex);
            if (removes.length) {
                this.onItemRemoved.emit(removes);
            }
            this._emitRowChange('remove', [rowIndex, rowIndex]);
        }
    }
    removeCol(colIndex) {
        if (colIndex > 0 && colIndex < this._indexSize.colCount) {
            const removes = [];
            this.eachColCells(colIndex, (item, index) => {
                if (item) {
                    this._deleteItemToRow(item);
                    removes.push({colIndex: colIndex, rowIndex: index, item: item})
                }
            })
            this._removeCol(colIndex);
            if (removes.length) {
                this.onItemRemoved.emit(removes);
            }
            this._emitColChange('remove', [colIndex, colIndex]);
        }
    }
    isEmptyRow(rowIndex): boolean {
        return this.everyRowCells(rowIndex, item => !item);
    }
    isEmptyCol(colIndex): boolean {
        return this.everyColCells(colIndex, item => !item);
    }
    trimBelow() {
        for (let i = this._indexSize.rowCount - 1; i >= 0; i--) {
            if (this.isEmptyRow(i)) {
                this.removeRow(i);
            } else {
                return;
            }
        }
    }
    trimRight() {
        for (let i = this._indexSize.rowCount - 1; i >= 0; i--) {
            if (this.isEmptyCol(i)) {
                this.removeCol(i);
            } else {
                return;
            }
        }
    }
    put(colIndex, rowIndex, item) {
        const oldItem = this.get(colIndex, rowIndex);
        const offset = this._put(colIndex, rowIndex, item);
        this._gridSize.width += offset.ox;
        this._gridSize.height += offset.oy;
        this._setDirtyCol(colIndex, offset.ox);
        this._setDirtyRow(rowIndex, offset.oy);
        // 处理item
        if (oldItem && oldItem !== item) {
            this._deleteItemToRow(oldItem);
            this.onItemRemoved.emit([{colIndex: colIndex, rowIndex: rowIndex, item: oldItem}])
        }
        if (item && item !== oldItem) {
            this._setItemToRow(item, this._rows[rowIndex]);
            this.onItemAdded.emit([{colIndex: colIndex, rowIndex: rowIndex, item: item}])
        }
        if (offset.ox) {
            this._emitRowChange('resize', [rowIndex, rowIndex]);
        }
        if (offset.oy) {
            this._emitColChange('resize', [colIndex, colIndex]);
        }
    }
    // 
    move(item, colIndex, rowIndex) {
        const index = this.index(item);
        if (index) {
            const oldColIndex = index[0];
            const oldRowIndex = index[1];
            if (oldColIndex !== colIndex || oldRowIndex !== rowIndex) {
                // remove
                const removedOffset = this._remove(oldColIndex, oldRowIndex);
                this._gridSize.width += removedOffset.ox;
                this._gridSize.height += removedOffset.oy;
                this._setDirtyCol(oldColIndex, removedOffset.ox);
                this._setDirtyRow(oldRowIndex, removedOffset.oy);
                // 处理item
                item && this._deleteItemToRow(item);
                // put
                const oldItem = this.get(colIndex, rowIndex);
                const offset = this._put(colIndex, rowIndex, item);
                this._gridSize.width += offset.ox;
                this._gridSize.height += offset.oy;
                this._setDirtyCol(colIndex, offset.ox);
                this._setDirtyRow(rowIndex, offset.oy);
                // 处理item
                if (oldItem && oldItem !== item) {
                    this._deleteItemToRow(oldItem);
                    this.onItemRemoved.emit([{colIndex: colIndex, rowIndex: rowIndex, item: oldItem}])
                }
                item && this._setItemToRow(item, this._rows[rowIndex]);
                if (removedOffset.ox) {
                    this._emitRowChange('resize', [oldRowIndex, oldRowIndex]);
                }
                if (removedOffset.oy) {
                    this._emitColChange('resize', [oldColIndex, oldColIndex]);
                }
                if (offset.ox) {
                    this._emitRowChange('resize', [rowIndex, rowIndex]);
                }
                if (offset.oy) {
                    this._emitColChange('resize', [colIndex, colIndex]);
                }
            }
        } else {
            this.put(colIndex, rowIndex, item);
        }
    }
    add(colIndex, rowIndex, item) {
        this.insertRow(rowIndex);
        this.insertColumn(colIndex);
        this.put(colIndex, rowIndex, item);
    }
    update(item) {
        const index = this.index(item);
        if (index) {
            const colIndex = index[0];
            const rowIndex = index[1];
            const offset = this._update(colIndex, rowIndex);
            this._gridSize.width += offset.ox;
            this._gridSize.height += offset.oy;
            this._setDirtyCol(colIndex, offset.ox);
            this._setDirtyRow(rowIndex, offset.oy);
            if (offset.ox) {
                this._emitRowChange('resize', [rowIndex, rowIndex]);
            }
            if (offset.oy) {
                this._emitColChange('resize', [colIndex, colIndex]);
            }
        }
    }
    remove(item): [number, number] {
        const index = this.index(item);
        if (index) {
            const colIndex = index[0];
            const rowIndex = index[1];
            const offset = this._remove(colIndex, rowIndex);
            this._gridSize.width += offset.ox;
            this._gridSize.height += offset.oy;
            this._setDirtyCol(colIndex, offset.ox);
            this._setDirtyRow(rowIndex, offset.oy);
            // 处理item
            if (item) {
                this._deleteItemToRow(item);
                this.onItemRemoved.emit([{colIndex: colIndex, rowIndex: rowIndex, item: item}])
            }
            if (offset.ox) {
                this._emitRowChange('resize', [rowIndex, rowIndex]);
            }
            if (offset.oy) {
                this._emitColChange('resize', [colIndex, colIndex]);
            }
        }
        return index;
    }
    get(colIndex, rowIndex) {
        if (this._rows[rowIndex] && (colIndex in this._rows[rowIndex])) {
            return this._rows[rowIndex][colIndex];
        }
        return undefined;
    }
    index(item): [number, number] {
        const row = this._getRow(item);
        if (row) {
            const rowIndex = this._rows.indexOf(row);
            const columnIndex = row.indexOf(item);
            return [columnIndex, rowIndex];
        }
        return undefined;
    }
    size(): {width: number, height: number} {
        return {...this._gridSize};
    }
    count(): [number, number] {
        return [this._indexSize.colCount, this._indexSize.rowCount];
    }
    getRowBox(rowIndex): GridLayoutBox {
        const rowSize = this._rowSizes[rowIndex];
        return rowSize ? {x: 0, y: rowSize[0], width: this._gridSize.width, height: rowSize[1]} : null;
    }
    getColBox(colIndex): GridLayoutBox {
        const colSize = this._colSizes[colIndex];
        return colSize ? {x: colSize[0], y: 0, width: colSize[1], height: this._gridSize.height} : null;
    }
    getItemBox(colIndex, rowIndex) {
        const rowSize = this._rowSizes[rowIndex];
        const colSize = this._colSizes[colIndex];
        if (rowSize && colSize) {
            return {x: colSize[0], y: rowSize[0], width: colSize[1], height: rowSize[1]};
        }
        return null;
    }
    each(fn: (item, colIndex, rowIndex) => void) {
        const range = {x: 0, y: 0, width: this._indexSize.colCount, height: this._indexSize.rowCount};
        this.eachCells(range, (item, colIndex, rowIndex) => {
            item && fn(item, colIndex, rowIndex);
        });
    }
    eachItems(range: GridRange, fn: (item, colIndex, rowIndex) => void) {
        this.eachCells(range, (item, colIndex, rowIndex) => {
            item && fn(item, colIndex, rowIndex);
        });
    }
    eachCells(range: GridRange, fn: (item, colIndex, rowIndex) => void) {
        if (range && range.width && range.height) {
            let item;
            // 垂直方向
            for (let i = range.x; i < range.x + range.width; i++) {
                // 水平方向
                for (let j = range.y; j < range.y + range.height; j++) {
                    item = this.get(i, j);
                    fn(item, i, j);
                }
            }
        }
    }
    everyRowCells(rowIndex, fn): boolean {
        if (rowIndex < this._indexSize.rowCount) {
            const row = this._rows[rowIndex];
            return row.every((item, index) => fn(item, index))
        }
        return true;
    }
    everyColCells(colIndex, fn): boolean {
        if (colIndex < this._indexSize.colCount) {
            for (let i = 0; i < this._rows.length; i++) {
                const row = this._rows[i];
                if (!fn(row[colIndex])) {
                    return false;
                }
            }
        }
        return true;
    }
    eachRowCells(rowIndex, fn) {
        if (rowIndex < this._indexSize.rowCount) {
            const row = this._rows[rowIndex];
            if (row) {
                row.forEach(fn);
            }
        }
    }
    eachColCells(colIndex, fn) {
        if (colIndex < this._indexSize.colCount) {
            this._rows.forEach(row => fn(row[colIndex]));
        }
    }
    updatePosition() {
        let rowFrom = this._dirtyIndex.rowIndex, colFrom = this._dirtyIndex.colIndex;
        let i, rowSize, colSize, offset;
        // 垂直方向
        if (rowFrom !== -1) {
            for (i = rowFrom; i < this._indexSize.rowCount; i++) {
                rowSize = rowSize || (this._rowSizes[i - 1] ? this._rowSizes[i - 1] : [0, 0]);
                offset = rowSize[0] + rowSize[1];
                if (this._rowSizes[i][0] !== offset) {
                    this._rowSizes[i][0] = offset;
                }
                rowSize = this._rowSizes[i];
            }
        }
        // 水平方向
        if (colFrom !== -1) {
            for (i = colFrom; i < this._indexSize.colCount; i++) {
                colSize = colSize || (this._colSizes[i - 1] ? this._colSizes[i - 1] : [0, 0]);
                offset = colSize[0] + colSize[1];
                if (this._colSizes[i][0] !== offset) {
                    this._colSizes[i][0] = offset;
                }
                colSize = this._colSizes[i];
            }
        }
        this._dirtyIndex = {colIndex: -1, rowIndex: -1};
        if (rowFrom !== -1 && rowFrom < this._indexSize.rowCount) {
            this._emitRowChange('position', [rowFrom, this._indexSize.rowCount - 1]);
        }
        if (colFrom !== -1 && colFrom < this._indexSize.colCount) {
            this._emitColChange('position', [colFrom, this._indexSize.colCount - 1]);
        }
    }
    private _setDirtyRow(rowIndex, offset, type: 'put' | 'insert' | 'remove' = 'put') {
        if (offset) {
            let dirtyRow;
            if (type === 'put') {
                dirtyRow = rowIndex + 1;
            } else if (type === 'insert') {
                dirtyRow = rowIndex + 1;
            } else {
                dirtyRow = rowIndex;
            }
            if (dirtyRow < this._indexSize.rowCount && (this._dirtyIndex.rowIndex === -1 || dirtyRow < this._dirtyIndex.rowIndex)) {
                this._dirtyIndex.rowIndex = dirtyRow;
            }
        }
    }
    private _setDirtyCol(colIndex, offset, type: 'put' | 'insert' | 'remove' = 'put') {
        if (offset) {
            let dirtyCol;
            if (type === 'put') {
                dirtyCol = colIndex + 1;
            } else if (type === 'insert') {
                dirtyCol = colIndex + 1;
            } else {
                dirtyCol = colIndex;
            }
            if (dirtyCol < this._indexSize.colCount && this._dirtyIndex.colIndex === -1 || dirtyCol < this._dirtyIndex.colIndex) {
                this._dirtyIndex.colIndex = dirtyCol;
            }
        }
    }

    private _update(colIndex, rowIndex): {ox: number, oy: number} {
        const item = this.get(colIndex, rowIndex);
        // 更新size
        let horOffset = 0, verOffset = 0, size;
        const itemSize = item ? this._size(item) : null;
        const rowSize = this._rowSizes[rowIndex];
        const colSize = this._colSizes[colIndex];
        if (itemSize) {
            if (itemSize.height > rowSize[1]) {
                size = Math.max(this._minGridSize.height, itemSize.height);
                verOffset = size - rowSize[1];
                rowSize[1] = size;
            } else {
                const maxHeight = this._maxRowHeight(rowIndex);
                verOffset = maxHeight[1] - rowSize[1];
                rowSize[1] = maxHeight[1];
            }
            if (itemSize.width > colSize[1]) {
                size = Math.max(this._minGridSize.width, itemSize.width);
                horOffset = size - colSize[1];
                colSize[1] = size;
            } else {
                const maxWidth = this._maxColWidth(colIndex);
                horOffset = maxWidth[1] - colSize[1];
                colSize[1] = maxWidth[1];
            }
        }
        return {
            ox: horOffset,
            oy: verOffset,
        }
    }
    private _remove(colIndex, rowIndex): {ox: number, oy: number} {
        let i;
        const oldItem = this.get(colIndex, rowIndex);
        // 设置值
        this._rows[rowIndex][colIndex] = undefined;
        // 更新size
        let horOffset = 0, verOffset = 0, size;
        if (oldItem) {
            // const itemSize = this._size(oldItem);
            const rowSize = this._rowSizes[rowIndex];
            const colSize = this._colSizes[colIndex];

            const maxHeight = this._maxRowHeight(rowIndex);
            verOffset = maxHeight[1] - rowSize[1];
            rowSize[1] = maxHeight[1];

            const maxWidth = this._maxColWidth(colIndex);
            horOffset = maxWidth[1] - colSize[1];
            colSize[1] = maxWidth[1];
        }
        return {
            ox: horOffset,
            oy: verOffset,
        }
    }
    private _put(colIndex, rowIndex, item): {ox: number, oy: number} {
        let i;
        // 补空行
        const rows = [];
        for (i = this._indexSize.rowCount; i <= rowIndex; i++) {
            this._insertRow(i);
            rows.push(i);
        }
        rows.length && this._emitRowChange('add', [rows[0], rows[rows.length - 1]]);
        // 补空列
        const cols = [];
        for (i = this._indexSize.colCount; i <= colIndex; i++) {
            this._insertCol(i);
            cols.push(i);
        }
        cols.length && this._emitColChange('add', [cols[0], cols[cols.length - 1]]);
        const oldItem = this.get(colIndex, rowIndex);
        if (!oldItem && !item) {
            // 如果两个都不存在，则不需要操作
            return {ox: 0, oy: 0};
        } else if (oldItem && !item) {
            // 如果item不存在则处理为移除
            return this._remove(colIndex, rowIndex);
        }
        let horOffset = 0, verOffset = 0, size;
        // 处理替换和添加
        // 设置值
        this._rows[rowIndex][colIndex] = item;
        // 更新size
        const itemSize = this._size(item);
        const rowSize = this._rowSizes[rowIndex];
        const colSize = this._colSizes[colIndex];
        if (itemSize.height > rowSize[1]) {
            size = Math.max(this._minGridSize.height, itemSize.height);
            verOffset = size - rowSize[1];
            rowSize[1] = size;
        } else {
            // 如果旧的元素是最大的一个，则重新计算
            const maxHeight = this._maxRowHeight(rowIndex);
            verOffset = maxHeight[1] - rowSize[1];
            rowSize[1] = maxHeight[1];
        }
        if (itemSize.width > colSize[1]) {
            size = Math.max(this._minGridSize.width, itemSize.width);
            horOffset = size - colSize[1];
            colSize[1] = size;
            // 如果旧的元素是最大的一个，则重新计算
        } else {
            const maxWidth = this._maxColWidth(colIndex);
            horOffset = maxWidth[1] - colSize[1];
            colSize[1] = maxWidth[1];
        }
        return {
            ox: horOffset,
            oy: verOffset,
        }
    }
    private _maxRowHeight(rowIndex): [number, number] {
        let height = this._minGridSize.height;
        let colIndex = -1;
        this.eachRowCells(rowIndex, (item, index) => {
            if (isDefined(item)) {
                const size = this._size(item);
                if (size.height > height) {
                    height = size.height;
                    colIndex = index;
                }
            }
        })
        return [colIndex, height];
    }
    private _maxColWidth(colIndex): [number, number] {
        let width = this._minGridSize.width;
        let rowIndex = -1;
        this.eachColCells(colIndex, (item, index) => {
            if (isDefined(item)) {
                const size = this._size(item);
                if (size.width > width) {
                    width = size.width;
                    rowIndex = index;
                }
            }
        })
        return [rowIndex, width];
    }
    private _removeRow(rowIndex) {
        // 删除行
        const row = this._rows.splice(rowIndex, 1)[0];
        // 更新行数
        this._indexSize.rowCount -= 1;
        // 清理行高
        const rowSize = this._rowSizes.splice(rowIndex, 1)[0];
        // 更新gridSize
        this._gridSize.height -= rowSize[1];
        // set dirty
        this._setDirtyRow(rowIndex, -rowSize[1], 'remove');
        // TODO 处理对列宽造成的影响
    }
    private _insertRow(rowIndex) {
        const row = [];
        // 设置行数量
        row.length = this._indexSize.colCount;
        // 插入行
        this._rows.splice(rowIndex, 0, row);
        // 更新行数
        this._indexSize.rowCount += 1;
        // 设置默认行大小
        let preRowSize = this._rowSizes[rowIndex - 1];
        preRowSize = preRowSize || [0, 0];
        const rowSize = [
            preRowSize[0] + preRowSize[1],
            this._minGridSize.height
        ];
        this._rowSizes.splice(rowIndex, 0, rowSize);
        // 更新gridSize
        this._gridSize.height += rowSize[1];
        this._setDirtyRow(rowIndex, rowSize[1], 'insert');
    }
    private _removeCol(colIndex) {
        // 删除列
        this._rows.forEach(row => {
            row.splice(colIndex, 1);
        })
        // 更新列数
        this._indexSize.colCount -= 1;
        // 清理列高
        const colSize = this._colSizes.splice(colIndex, 1)[0];
        // 更新gridSize
        this._gridSize.height -= colSize[1];
        // set dirty
        this._setDirtyCol(colIndex, -colSize[1], 'remove');
        // TODO 处理对行高造成的影响
    }
    private _insertCol(colIndex) {
        this._rows.forEach(row => {
            // 插入空列
            row.splice(colIndex, 0, undefined);
        })
        // 更新列数
        this._indexSize.colCount += 1;
        // 设置默认列大小
        let preColSize = this._colSizes[this._colSizes.length - 1];
        preColSize = preColSize || [0, 0];
        const colSize = [
            preColSize[0] + preColSize[1],
            this._minGridSize.width
        ];
        this._colSizes.splice(colIndex, 0, colSize);
        // 更新gridSize
        this._gridSize.width += colSize[1];
        this._setDirtyCol(colIndex, colSize[1], 'insert');
    }
    private _deleteItemToRow(item) {
        if (this._id) {
            const id = this._id(item);
            delete this._itemToRow[id];
        } else {
            this._itemToRow.delete(item);
        }
    }
    private _setItemToRow(item, row) {
        if (this._id) {
            const id = this._id(item);
            this._itemToRow[id] = row;
        } else {
            this._itemToRow.set(item, row);
        }
    }
    private _getRow(item): T[] {
        if (this._id) {
            const id = this._id(item);
            return this._itemToRow[id];
        } else {
            return this._itemToRow.get(item);
        }
    }
    private _emitRowChange(type: 'add' | 'remove' | 'resize' | 'position', range: [number, number]) {
        if (range && range.length) {
            this.onRowChange.emit({type: type, range: range});
        }
    }
    private _emitColChange(type: 'add' | 'remove' | 'resize' | 'position', range: [number, number]) {
        if (range && range.length) {
            this.onColChange.emit({type: type, range: range});
        }
    }
}
