import { demos, IDemoDesc } from "./demos";
import { removeClass, addClass } from "neurons-dom";

// 使用直接引入的方式进行快速开发
const listContainer = document.querySelector('.list');
const demoContainer = document.querySelector('.demo-page');
const pages = [];
let currentPage;

function selectPage(page, index) {
    if (currentPage) {
        removeClass(currentPage.itemDom , 'selected');
        currentPage.pageDom && removeClass(currentPage.pageDom , 'selected');
    }
    currentPage = page;
    // itemDom
    addClass(currentPage.itemDom, 'selected');
    // pageDom
    if (currentPage.pageDom) {
        addClass(currentPage.pageDom, 'selected');
    } else {
        const pageDom = document.createElement('div');
        pageDom.className = 'demo-container';
        addClass(pageDom, 'selected');
        demoContainer.appendChild(pageDom);
        currentPage.pageDom = pageDom;
        (currentPage.demo.cases || []).forEach((demoCase, i) => {
            const dom = document.createElement('div');
            dom.className = 'demo-case';
            const title = document.createElement('div');
            title.innerHTML = `${i + 1}. ${demoCase.title}`;
            title.className = 'demo-case-title';
            const container = document.createElement('div');
            container.className = 'demo-case-container';
            dom.appendChild(title);
            dom.appendChild(container);
            pageDom.appendChild(dom);
            demoCase.bootstrap(container);
        });
    }
}

function createListItem(demo, index) {
    const dom = document.createElement('div');
    dom.className = 'item';
    dom.innerHTML = demo.title;
    listContainer.appendChild(dom);
    const page = {
        demo: demo,
        index: index,
        itemDom: dom,
        pageDom: null,
    }
    pages.push(page)
    dom.addEventListener('click', function () {
        selectPage(page, index);
    })
}
// 创建list
demos.forEach((demo, index) => {
    createListItem(demo, index);
});

selectPage(pages[0], 0);