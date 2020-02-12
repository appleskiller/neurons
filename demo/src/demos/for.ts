import { register } from "../demos";
import { bind } from "../../../src";
import { randomStrings, randomTexts } from '../utils';

register({
    title: '*for',
    cases: [
        {
            title: '*for="item in [1, 2, 3, 4]"',
            bootstrap: container => {
                const itemCount = 10;
                // let time = Date.now();
                // randomStrings('item ', itemCount).forEach(str => {
                //     const dom = document.createElement('div');
                //     dom.innerHTML = str;
                //     container.appendChild(dom);
                // })
                // console.log(Date.now() - time);
                let time = Date.now();
                bind(`
                    数组内容为：
                    <span *for="item in [1, 2, 3, 4]" let-length="$length" let-index="$index">
                        {{item}}{{(index === length - 1) ? '' : ','}}
                    </span>
                `, {
                    container: container
                });
                console.log(Date.now() - time);
            }
        }, {
            title: '增删元素',
            bootstrap: container => {
                let itemCount = 5;
                const array = randomStrings('item ', itemCount).map(v => { return { label: v } });
                bind(`
                    <button (click)="onInsert()">插入到最后</button>
                    <button (click)="onInsert(0)">插入到首位</button>
                    <button (click)="onInsert(2)">插入到第2个索引位置</button>
                    <button (click)="onRemove(3)">删除第3个索引位置的元素</button>
                    <button (click)="onUpdate(4)">更新第4个索引位置的元素</button>
                    <div>
                        <div *for="item, index in array">[{{index}}] {{item.label}}</div>
                    </div>
                `, {
                    container: container,
                    state: {
                        array: array,
                        onInsert: index => {
                            if (index === undefined) {
                                itemCount += 1;
                                array.push({label: `新增元素 ${itemCount}`});
                            } else {
                                itemCount += 1;
                                array.splice(index, 0, { label: `新增元素 ${itemCount}` });
                            }
                        },
                        onRemove: index => {
                            if (index === undefined) {
                                array.pop();
                            } else {
                                array.splice(index, 1);
                            }
                        },
                        onUpdate: index => {
                            if (index !== undefined) {
                                array[index].label = `变更元素 ${Math.random()}`
                            }
                        }
                    }
                });
            }
        }, {
            title: '过滤和排序',
            bootstrap: container => {
                let itemCount = 5;
                const sortLabels = ['无', '正序', '倒序'];
                let sortIndex = 0;
                let filterText = '';
                const array = randomTexts(itemCount);
                const filterAndSort = (sortIndex, filterText) => {
                    let filteredArray = array.filter(item => item.indexOf(filterText) !== -1);
                    switch (sortIndex) {
                        case 1:
                            filteredArray = filteredArray.sort();
                            break;
                        case 2:
                            filteredArray = filteredArray.sort().reverse();
                            break;
                        default:
                            filteredArray = filteredArray.concat();
                            break;
                    }
                    return filteredArray;
                }
                const ref = bind(`
                    <button (click)="onSort()">{{sortLabel}}</button>
                    <input #input (input)="onFilter(input.value)" placeholder="输入过滤字符">
                    <div>
                        <div *for="item, index in array">[{{index}}] {{item}}</div>
                    </div>
                `, {
                    container: container,
                    state: {
                        array: filterAndSort(sortIndex, filterText),
                        sortLabel: sortLabels[sortIndex],
                        onSort: () => {
                            sortIndex += 1;
                            if (sortIndex >= sortLabels.length) { sortIndex = 0; }
                            ref.setState({
                                sortLabel: sortLabels[sortIndex],
                                array: filterAndSort(sortIndex, filterText)
                            });
                        },
                        onFilter: text => {
                            filterText = text || '';
                            ref.setState({
                                array: filterAndSort(sortIndex, filterText)
                            });
                        },
                    }
                });
            }
        }
    ]
})