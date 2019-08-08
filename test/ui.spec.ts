import { ui } from '../src/ui';
import { simulateMouseEvent } from '../src/utils/domutils';
import { UIBinding, Property, Emitter } from '../src/ui/factory/decorator';
import { IEmitter } from '../src';

describe('ui', () => {
    beforeAll(() => {
        return new Promise((resolve) => {
            resolve();
        });
    });
    afterAll(() => {
        return new Promise((resolve) => {
            resolve();
        });
    });
    describe('template compile & instantiate & renderer & binding.', () => {
        describe('create with plain text without a container', () => {
            const template = `plain text`;
            const elementRef = ui.bind(template);
            it('should be instantiated', () => {
                expect(elementRef).toBeDefined();
            });
        });
        describe('create with plain text without a valided container', () => {
            const dom = document.createElement('div');
            const template = `plain text`;
            const elementRef = ui.bind(template, { container: dom });
            it('dom.innerText should be "plain text"', () => {
                expect(dom.innerText).toBe(template);
            });
        });
        describe('render dom/class/style/attributes to a container', () => {
            const dom = document.createElement('div');
            const template = `<div class="template-class" some="val"><div class="template-child" style="opacity: 1">text</div></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('dom.children.length should be 1', () => {
                expect(dom.children.length).toBe(1);
            });
            it('query .template-class dom should be defined', () => {
                expect(dom.querySelector('.template-class')).toBeDefined();
            });
            it('attr "some" of .template-class dom should be "val"', () => {
                expect(dom.querySelector('.template-class').getAttribute('some')).toBe('val');
            });
            it('query .template-child dom should be defined', () => {
                expect(dom.querySelector('.template-child')).toBeDefined();
            });
            it('value of .template-child dom opacity style should be 1', () => {
                expect(dom.querySelector('.template-child')['style'].opacity).toBe('1');
            });
            it('innerHTML of .template-child dom should be "text"', () => {
                expect(dom.querySelector('.template-child').innerHTML).toBe('text');
            });
        });
        describe('binding class: [class]="className"', () => {
            const dom = document.createElement('div');
            const template = `<div [class]="className"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: { className: 'binded-class' } });
            it('query .binded-class dom should be defined', () => {
                expect(dom.querySelector('.binded-class')).toBeDefined();
            });
        });
        describe(`binding class - with class string: [class]="'binded-class'"`, () => {
            const dom = document.createElement('div');
            const template = `<div [class]="'binded-class'"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('query .binded-class dom should be defined', () => {
                expect(dom.querySelector('.binded-class')).toBeDefined();
            });
        });
        describe(`binding class - with json object: [class]="{'binded-class': true, 'removed-class': false}"`, () => {
            const dom = document.createElement('div');
            const template = `<div [class]="className"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: { className: 'binded-class' } });
            it('query .binded-class dom should be defined', () => {
                expect(dom.querySelector('.binded-class')).toBeDefined();
            });
            it('query .removed-class dom should be null', () => {
                expect(dom.querySelector('.removed-class')).toBeNull();
            });
        });
        describe('binding class - with binding hash object: [class]="hash"', () => {
            const dom = document.createElement('div');
            const template = `<div [class]="hash"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: { hash: {
                'binded-class': true,
                'removed-class': false,
            } } });
            it('query .binded-class dom should be defined', () => {
                expect(dom.querySelector('.binded-class')).toBeDefined();
            });
            it('query .removed-class dom should be null', () => {
                expect(dom.querySelector('.removed-class')).toBeNull();
            });
        });
        describe('binding style: [style]="stylestring"', () => {
            const dom = document.createElement('div');
            const template = `<div [style]="stylestring"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: { stylestring: 'opacity: 1' } });
            it('value of dom opacity style should be 1', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe(`binding style - with style string: [style]="'opacity: 1'"`, () => {
            const dom = document.createElement('div');
            const template = `<div [style]="'opacity: 1'"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom opacity style should be 1', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe(`binding style - with json object: [style]="{'opacity': 1}"`, () => {
            const dom = document.createElement('div');
            const template = `<div [style]="{'opacity': 1}"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom opacity style should be 1', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe('binding style - with property: [style.opacity]="1"', () => {
            const dom = document.createElement('div');
            const template = `<div [style.opacity]="1"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom opacity style should be 1', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe(`binding style - with binding hash object: [style]="hash"`, () => {
            const dom = document.createElement('div');
            const template = `<div [style]="hash"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                hash: {
                    'opacity': 1,
                    'backgroundColor': '#CCC',
                    'font-size': 12,
                }
            } });
            it('value of dom opacity style should be 1', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
            it('value of dom backgroundColor style should be #CCC', () => {
                expect(dom.children.item(0)['style'].backgroundColor).toBe('rgb(204, 204, 204)');
            });
            it('value of dom fontSize style should be 12px', () => {
                expect(dom.children.item(0)['style'].fontSize).toBe('12px');
            });
        });
        describe(`binding attribute: [attr]="value"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="value"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                value: 'attrValue'
            } });
            it('value of dom attr should be "attrValue"', () => {
                expect(dom.children.item(0).getAttribute('attr')).toBe('attrValue');
            });
        });
        describe(`binding attribute - with plain text: [attr]="'attrValue'"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="'attrValue'"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom attr should be "attrValue"', () => {
                expect(dom.children.item(0).getAttribute('attr')).toBe('attrValue');
            });
        });
        describe(`binding attribute - with literal expression: [attr]="'attr' + 'Value'"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="'attr' + 'Value'"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom attr should be "attrValue"', () => {
                expect(dom.children.item(0).getAttribute('attr')).toBe('attrValue');
            });
        });
        describe(`binding attribute - with conditional expression: [attr]="true ? 'attr' + 'Value' : ''"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="true ? 'attr' + 'Value' : ''"></div>`;
            const elementRef = ui.bind(template, { container: dom });
            it('value of dom attr should be "attrValue"', () => {
                expect(dom.children.item(0).getAttribute('attr')).toBe('attrValue');
            });
        });
        describe(`binding attribute - with call expression: [attr]="getAttr(name)"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="getAttr(name)"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                getAttr: (name) => {
                    return name;
                },
                name: 'attrValue'
            } });
            it('value of dom attr should be "attrValue"', () => {
                expect(dom.children.item(0).getAttribute('attr')).toBe('attrValue');
            });
        });
        describe(`binding event: (click)="onClick(1, $event)"`, () => {
            const dom = document.createElement('div');
            const template = `<div (click)="onClick(1, $event)"></div>`;
            let clicked = false, clickedContext, clickEvent, clickNum = 0;
            const state = {
                onClick: function (num, event) {
                    clicked = true;
                    clickNum = num;
                    clickedContext = this;
                    clickEvent = event;
                },
            }
            const elementRef = ui.bind(template, { container: dom, state: state });
            simulateMouseEvent(dom.children.item(0), 'click');
            it('clicked should be true', () => {
                expect(clicked).toBeTruthy();
            });
            it('clickNum should be 1', () => {
                expect(clickNum).toBe(1);
            });
            it('clickedContext should be state', () => {
                expect(clickedContext).toBe(state);
            });
            it('clickEvent should be instanceof MouseEvent', () => {
                expect(clickEvent instanceof MouseEvent).toBeTruthy();
            });
        });
        describe(`state updating: [attr]="attrValue"`, () => {
            const dom = document.createElement('div');
            const template = `<div [attr]="attrValue"></div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                attrValue: 'A'
            } });
            it('value of dom attr should be "B" before setState({ attrValue: "B" })', () => {
                elementRef.setState({
                    attrValue: 'B'
                })
                expect(dom.children.item(0).getAttribute('attr')).toBe('B');
            });
        });
    });
    describe('build in directive - for.', () => {
        describe('*for="item in [1, 2, 3]"', () => {
            const dom = document.createElement('div');
            const template = `<div *for="item in [1, 2, 3]">{{item}}</div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                array: [1, 2, 3]
            } });
            it('dom.children.length should be 3', () => {
                expect(dom.children.length).toBe(3);
            });
            it('value of dom.children should be 1, 2, 3', () => {
                expect(dom.children.item(0).innerHTML).toBe('1');
                expect(dom.children.item(1).innerHTML).toBe('2');
                expect(dom.children.item(2).innerHTML).toBe('3');
            });
        });
        describe('*for="item in array" & bind with item.value', () => {
            const dom = document.createElement('div');
            const template = `<div *for="item in array"><div>{{item.value}}</div></div>`;
            const elementRef = ui.bind(template, { container: dom, state: {
                array: [{value: 1}, {value: 2}, {value: 3}]
            } });
            it('dom.children.length should be 3', () => {
                expect(dom.children.length).toBe(3);
            });
            it('content of dom.children should be 1, 2, 3', () => {
                expect(dom.children.item(0).children.item(0).innerHTML).toBe('1');
                expect(dom.children.item(1).children.item(0).innerHTML).toBe('2');
                expect(dom.children.item(2).children.item(0).innerHTML).toBe('3');
            });
        });
        describe('binding varibles in scope of template', () => {
            const dom = document.createElement('div');
            const template = `<div *for="item in array" [class]="className"><div>{{item.value}}</div></div>`;
            const elementRef = ui.bind(template, { container: dom, state: <any>{
                array: [{value: 1}, {value: 2}, {value: 3}],
                className: 'item-class'
            } });
            it('contents of every dom.children should be "A", "B" after setState({array: [{value: "A"}, {value: "B"}]})', () => {
                elementRef.setState({
                    array: [{value: "A"}, {value: "B"}]
                })
                expect(dom.children.length).toBe(2);
                expect(dom.children.item(0).children.item(0).innerHTML).toBe('A');
                expect(dom.children.item(1).children.item(0).innerHTML).toBe('B');
            });
            it('className of every dom.children should be "changed-class" after setState({className: "changed-class"})', () => {
                elementRef.setState({
                    className: 'changed-class'
                })
                expect(dom.children.item(0).className.indexOf('changed-class') !== -1).toBe(true);
                expect(dom.children.item(1).className.indexOf('changed-class') !== -1).toBe(true);
            });
        });
    });
    describe('UIBinding decoritor & instantiater & bootstrap.', () => {
        describe('decorate a "plain text" UIBinding', () => {
            @UIBinding({ selector: 'plain-text', template: 'plain text' })
            class TestUIBinding {}
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<plain-text/>`, { container: dom });
            it('dom.innerHTML should be "plain text"', () => {
                expect(dom.innerHTML).toBe('plain text');
            });
        });
        describe('decorate a "plain text" UIBinding via binding varible text = "plain text"', () => {
            @UIBinding({ selector: 'plain-text-binding', template: '{{text}}' })
            class TestUIBinding {
                @Property() text = 'plain text'
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<plain-text-binding/>`, { container: dom });
            it('dom.innerHTML should be "plain text"', () => {
                expect(dom.innerHTML).toBe('plain text');
            });
        });
        describe('decorate a simple UIBinding via binding varibles.', () => {
            @UIBinding({ selector: 'simple-binding', template: '<div [class]="className" [style.opacity]="opacity">{{text}}</div>' })
            class TestUIBinding {
                @Property() className = 'test-class';
                @Property() text = 'plain text';
                @Property() opacity = 1;
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<simple-binding/>`, { container: dom });
            it('dom.children.item(0).innerHTML should be "plain text"', () => {
                expect(dom.children.item(0).innerHTML).toBe('plain text');
            });
            it('dom.children.item(0).className should be "test-class"', () => {
                expect(dom.children.item(0).className).toBe('test-class');
            });
            it('dom.children.item(0).style.opacity should be "1"', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe('multi different UIBinding in template.', () => {
            @UIBinding({ selector: 'ui-a', template: '{{text}}' })
            class TestUIBindingA {
                @Property() text = 'plain text';
            }
            @UIBinding({ selector: 'ui-b', template: '<div [class]="className" [style.opacity]="opacity">{{text}}</div>' })
            class TestUIBindingB {
                @Property() className = 'test-class';
                @Property() text = 'plain text';
                @Property() opacity = 1;
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<ui-a/><ui-b/>`, { container: dom });
            it('dom.childNodes.length should be 2', () => {
                expect(dom.childNodes.length).toBe(2);
            });
            it('dom.children.length should be 1', () => {
                expect(dom.children.length).toBe(1);
            });
            it('dom.childNodes.item(0).nodeType should be 3 (Text)', () => {
                expect(dom.childNodes.item(0).nodeType).toBe(3);
            });
            it('dom.childNodes.item(0).data should be 3 "plain text"', () => {
                expect(dom.childNodes.item(0)['data']).toBe('plain text');
            });
            it('dom.children.item(0).innerHTML should be "plain text"', () => {
                expect(dom.children.item(0).innerHTML).toBe('plain text');
            });
            it('dom.children.item(0).className should be "test-class"', () => {
                expect(dom.children.item(0).className).toBe('test-class');
            });
            it('dom.children.item(0).style.opacity should be "1"', () => {
                expect(dom.children.item(0)['style'].opacity).toBe('1');
            });
        });
        describe('decorate a Property text, and change value to "changed text" via binding plain value.', () => {
            @UIBinding({ selector: 'property-binding', template: '<div [class]="className" [style.opacity]="opacity">{{text}}</div>' })
            class TestUIBinding {
                @Property() className = 'test-class';
                @Property() text = 'plain text';
                @Property() opacity = 1;
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<property-binding [text]="'changed text'"/>`, { container: dom });
            it('dom.children.item(0).innerHTML should be "changed text"', () => {
                expect(dom.children.item(0).innerHTML).toBe('changed text');
            });
        });
        describe('decorate a properties, and change value via setState" via binding text varible.', () => {
            @UIBinding({ selector: 'property-binding-varible', template: '<div [class]="className" [style.opacity]="opacity">{{text}}</div>' })
            class TestUIBinding {
                @Property() className = 'test-class';
                @Property() text = 'plain text';
                @Property() opacity = 1;
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<property-binding-varible [text]="text" [className]="className" [opacity]="opacity"/>`, { container: dom, state: {
                text: 'changed text',
                className: '',
                opacity: 1
            } });
            it('dom.children.item(0).innerHTML should be "changed text via state" after setState', () => {
                elementRef.setState({
                    text: 'changed text via state',
                })
                expect(dom.children.item(0).innerHTML).toBe('changed text via state');
            });
            it('dom.children.item(0).className should be "changed-class-via-state" after setState', () => {
                elementRef.setState({
                    className: 'changed-class-via-state'
                })
                expect(dom.children.item(0).className.indexOf('changed-class-via-state')).not.toBe(-1);
            });
            it('dom.children.item(0).style.opacity should be "0.5" after setState', () => {
                elementRef.setState({
                    opacity: '0.5'
                })
                expect(dom.children.item(0)['style'].opacity).toBe('0.5');
            });
        });
        describe('decorate a emitters, and listen value change via binding.', () => {
            @UIBinding({ selector: 'emitter-binding-varible', template: '<div (click)="onClick($event)" [class]="className" [style.opacity]="opacity">{{text}}</div>' })
            class TestUIBinding {
                @Property() className = 'test-class';
                @Property() opacity = 1;
                @Property() text = 'plain text';
                @Emitter() itemClicked: IEmitter<{cause: MouseEvent, value: number}>;
                onClick(e) {
                    this.itemClicked.emit({
                        cause: e,
                        value: 1
                    });
                }
            }
            const dom = document.createElement('div');
            let received = false, clickedContext, clickEvent, clickNum = 0;
            const state = {
                onItemClicked(event) {
                    received = true;
                    clickNum = event.value;
                    clickEvent = event.cause;
                    clickedContext = this;
                }
            }
            const elementRef = ui.bind(`<emitter-binding-varible (itemClicked)="onItemClicked($event)"/>`, { container: dom, state: state });
            simulateMouseEvent(dom.children.item(0), 'click');
            it('received should be true', () => {
                expect(received).toBeTruthy();
            });
            it('clickNum should be 1', () => {
                expect(clickNum).toBe(1);
            });
            it('clickedContext should be state', () => {
                expect(clickedContext).toBe(state);
            });
            it('clickEvent should be instanceof MouseEvent', () => {
                expect(clickEvent instanceof MouseEvent).toBeTruthy();
            });
        });
        describe('repeat UIBinding via *for', () => {
            @UIBinding({ selector: 'repeat-binding', template: '<div>{{text}}</div>' })
            class TestUIBinding {
                @Property() text = 'plain text';
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<repeat-binding *for="text in array" [text]="text"/>`, { container: dom, state: {
                array: ['text 1', 'text 2', 'text 3']
            } });
            it('innerHTML of every dom.children should be changed after setState', () => {
                elementRef.setState({
                    array: ['text A', 'text B']
                })
                expect(dom.children.length).toBe(2);
                expect(dom.children.item(0).innerHTML).toBe('text A');
                expect(dom.children.item(1).innerHTML).toBe('text B');
            });
            it('innerHTML of every dom.children should be changed after detectChanges', () => {
                (elementRef.getState() as any).array[0] = 'text changed'
                elementRef.detectChanges();
                expect(dom.children.item(0).innerHTML).toBe('text changed');
            });
        });
        describe('inset content into UIBinding via inner content placeholder', () => {
            @UIBinding({ selector: 'outlet-content-binding', template: '<div><content/></div>' })
            class TestUIBinding {
                @Property() name = 'content-test'
            }
            const dom = document.createElement('div');
            const elementRef = ui.bind(`<outlet-content-binding>outlet text</outlet-content-binding>`, { container: dom, state: {
                
            } });
            it('dom.children.item(0).innerHTML should be "outlet text"', () => {
                expect(dom.children.item(0).childNodes.item(0)['data']).toBe('outlet text');
            });
        });
    });
    // TODO binding - diff merge
    // TODO class binding: outer changed --merge--> inner changed
    // TODO class binding: [class]="{[prop]: statement}"
    // TODO style binding: [style]="{[prop]: statement}"
    // TODO style binding: outer changed --merge--> inner changed
    // TODO <ne-binding *template= *selector= *class= *state=/>
    // TODO <div *binding="state" />
    // TODO life hooks
});