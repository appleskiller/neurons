import { register } from "../demos";
import { bind, Binding, Property, Emitter, Inject, icons } from "../../../src";
import { randomStrings, randomTexts } from '../utils';
import { appendCSSTagOnce } from 'neurons-dom';
import { Button } from '../../../src/components/button/button';
import { alert, modal, sidePanel } from '../../../src/components/dialog';
import { Input } from '../../../src/components/input/input';

appendCSSTagOnce('dialog-demo-container', `
.dialog-demo-container .ne-button {
    margin-right: 12px;
}
`)

register({
    title: '对话框',
    cases: [
        {
            title: 'alert({...})',
            bootstrap: container => {
                bind(`
                    <div class="dialog-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showTextAlert()">简单内容对话框</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSimpleAlert()">仅确定按钮</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showDisableCloseAlert()">禁止点击蒙层关闭</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showHTMLAlert()">HTML内容</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showBindingAlert()">复杂绑定内容</ne-button>
                    </div>
                `, {
                    requirements: [Button, Input],
                    container: container,
                    state: {
                        showTextAlert: () => {
                            alert({
                                title: '对话框',
                                message: '文本内容...',
                            })
                        },
                        showSimpleAlert: () => {
                            alert({
                                title: '对话框',
                                message: '文本内容...',
                                hideCancelButton: true,
                            })
                        },
                        showDisableCloseAlert: () => {
                            alert({
                                title: '对话框',
                                message: '文本内容...',
                                disableClose: true,
                            })
                        },
                        showHTMLAlert: () => {
                            alert({
                                title: '对话框',
                                html: '<input placeholder="请输入...">',
                            })
                        },
                        showBindingAlert: () => {
                            alert({
                                title: '对话框',
                                body: {
                                    template: `<ne-input placeholder="请输入..." [value]="value"/>`,
                                    state: {
                                        value: '一段绑定文本'
                                    }
                                },
                            })
                        },
                    }
                })
            }
        }, {
            title: 'modal({...})',
            bootstrap: container => {
                bind(`
                    <div class="dialog-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showTextModal()">默认框体</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSimpleModal()">仅确定按钮</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showDisableCloseModal()">禁止点击蒙层关闭</ne-button>
                    </div>
                    <div class="dialog-demo-container">
                    <ne-button mode="flat" color="primary" (click)="showModal('center')">居中（默认）</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('right')">右侧</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('left')">左侧</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('top')">顶部</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('bottom')">底部</ne-button>
                    </div>
                    <div class="dialog-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showModal('topLeft')">左上角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('topRight')">右上角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('bottomLeft')">左下角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showModal('bottomRight')">右下角</ne-button>
                    </div>
                `, {
                    requirements: [Button],
                    container: container,
                    state: {
                        showTextModal: () => {
                            modal({
                                title: '模态框',
                                body: {
                                    source: `
                                        <div>姓名：<ne-input [value]="name"></ne-input></div>
                                        <div>年龄：<ne-input [value]="age"></ne-input></div>
                                    `,
                                    state: {
                                        name: '张三',
                                        age: 35
                                    },
                                },
                            })
                        },
                        showSimpleModal: () => {
                            modal({
                                title: '模态框',
                                body: {
                                    source: `
                                        <div>姓名：<ne-input [value]="name"></ne-input></div>
                                        <div>年龄：<ne-input [value]="age"></ne-input></div>
                                    `,
                                    state: {
                                        name: '张三',
                                        age: 35
                                    },
                                },
                                hideCancelButton: true
                            })
                        },
                        showDisableCloseModal: () => {
                            modal({
                                title: '模态框',
                                body: {
                                    source: `
                                        <div>姓名：<ne-input [value]="name"></ne-input></div>
                                        <div>年龄：<ne-input [value]="age"></ne-input></div>
                                    `,
                                    state: {
                                        name: '张三',
                                        age: 35
                                    },
                                },
                                disableClose: true,
                            })
                        },
                        showModal: (position) => {
                            modal({
                                title: '模态框',
                                body: {
                                    source: `
                                        <div>姓名：<ne-input [value]="name"></ne-input></div>
                                        <div>年龄：<ne-input [value]="age"></ne-input></div>
                                    `,
                                    state: {
                                        name: '张三',
                                        age: 35
                                    },
                                },
                                position: position,
                            })
                        }
                    }
                })
            }
        }, {
            title: 'sidePanel({...})',
            bootstrap: container => {
                bind(`
                    <div class="dialog-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('right', 700, '')">右侧（默认）</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('left', 700, '')">左侧</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('top', '', 400)">顶部</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('bottom', '', 400)">底部</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('center', 700, 400)">居中</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('center', '', '')">铺满</ne-button>
                    </div>
                    <div class="dialog-demo-container">
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('topLeft', 400, 300)">左上角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('topRight', 400, 300)">右上角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('bottomLeft', 400, 300)">左下角</ne-button>
                        <ne-button mode="flat" color="primary" (click)="showSidePanel('bottomRight', 400, 300)">右下角</ne-button>
                    </div>
                `, {
                    requirements: [Button],
                    container: container,
                    state: {
                        showSidePanel: (position, width, height) => {
                            sidePanel({
                                title: '侧拉面板',
                                body: {
                                    source: `
                                        <div>姓名：<ne-input [value]="name"></ne-input></div>
                                        <div>年龄：<ne-input [value]="age"></ne-input></div>
                                    `,
                                    state: {
                                        name: '张三',
                                        age: 35
                                    },
                                },
                                position: position,
                                width: width,
                                height: height,
                            })
                        }
                    }
                })
            }
        }
    ]
})