
import { parseHTML } from "../../src/binding/compiler/parser/template";
import { IStatementInfo } from '../../src/binding/compiler/parser/statement';
describe('Neurons::Compiler', () => {
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
    describe('Plain template', () => {
        const template = `
            <input>
            <div #templ tname="div" class="class-a class-b" style="color: #FFFFFF; font-size: 15px"/>
            <svg width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>
        `
        const ast = parseHTML(template);
        // structure
        it('ast.childNodes.length should be 3', () => {
            expect(ast.childNodes).toBeDefined();
            expect(ast.childNodes.length).toBe(3);
        })
        it('ast.childNodes[0].name should be "input"', () => {
            expect(ast.childNodes[0].name).toBe('input');
        })
        it('ast.childNodes[1].name should be "div"', () => {
            expect(ast.childNodes[1].name).toBe('div');
        })
        it('ast.childNodes[2].name should be "svg"', () => {
            expect(ast.childNodes[2].name).toBe('svg');
        })
        it('ast.childNodes[2].xmlns should be "http://www.w3.org/2000/svg"', () => {
            expect(ast.childNodes[2].xmlns).toBe('http://www.w3.org/2000/svg');
        })
        // id
        it('ast.childNodes[1].id should be "templ"', () => {
            expect(ast.childNodes[1].id).toBe('templ');
        })
        // attr
        it('ast.childNodes[1].attrs.tname should be "div"', () => {
            expect(ast.childNodes[1].attrs.tname).toBe('div');
        })
        // class
        it(`ast.childNodes[1].classes['class-a'] should be true`, () => {
            expect(ast.childNodes[1].classes['class-a']).toBe(true);
        })
        it(`ast.childNodes[1].classes['class-b'] should be true`, () => {
            expect(ast.childNodes[1].classes['class-b']).toBe(true);
        })
        // style
        it(`ast.childNodes[1].styles['color'] should be '#FFFFFF'`, () => {
            expect(ast.childNodes[1].styles['color']).toBe('#FFFFFF');
        })
        it(`ast.childNodes[1].styles['fontSize'] should be '15px'`, () => {
            expect(ast.childNodes[1].styles['fontSize']).toBe('15px');
        })
    });
    describe('Binding template', () => {
        // inputs
        describe('input case', () => {
            const template = `
                <div
                    [caseA]="'div'"
                    [caseB]="value"
                    [caseC]="obj.value"
                    [caseD]="getValue()"
                    [caseE]="value ? 1 : 0"
                />
            `
            const node = parseHTML(template).childNodes[0];
            it(`node.attrs.caseA should be 'div'`, () => {
                expect(node.attrs.caseA).toBeTruthy('div');
            });
            it(`node.inputs.caseB.varibles should be has property 'value'`, () => {
                expect('value' in node.inputs.caseB.varibles).toBeTruthy();
            });
            it(`node.inputs.caseC.varibles should be has property 'obj'`, () => {
                expect('obj' in node.inputs.caseC.varibles).toBeTruthy();
            });
            it(`node.inputs.caseC.chainProps should be has property 'obj.value'`, () => {
                expect('obj.value' in node.inputs.caseC.chainProps).toBeTruthy();
            });
            it(`node.inputs.caseD.functions should be has property 'getValue'`, () => {
                expect('getValue' in node.inputs.caseD.functions).toBeTruthy();
            });
            it(`node.inputs.caseE.varibles should be has property 'value'`, () => {
                expect('value' in node.inputs.caseE.varibles).toBeTruthy();
            });
        });
        // outputs
        describe('output case', () => {
            const template = `
                <div
                    (caseA)="callback($event)"
                    (caseB)="value = 1; callback($event)"
                    (caseC)="obj.value"
                />
            `
            const node = parseHTML(template).childNodes[0];
            it(`node.outputs.caseA.functions should be has property 'callback'`, () => {
                expect('callback' in node.outputs.caseA.functions).toBeTruthy();
            });
            it(`node.outputs.caseA.varibles should be has property '$event'`, () => {
                expect('$event' in node.outputs.caseA.varibles).toBeTruthy();
            });
            it(`node.outputs.caseB.functions should be has property 'callback'`, () => {
                expect('callback' in node.outputs.caseB.functions).toBeTruthy();
            });
            it(`node.outputs.caseB.varibles should be has property '$event'`, () => {
                expect('$event' in node.outputs.caseB.varibles).toBeTruthy();
            });
            it(`node.outputs.caseB.varibles should be has property 'value'`, () => {
                expect('value' in node.outputs.caseB.varibles).toBeTruthy();
            });
            it(`node.outputs.caseC.varibles should be has property 'obj'`, () => {
                expect('obj' in node.outputs.caseC.varibles).toBeTruthy();
            });
            it(`node.outputs.caseC.chainProps should be has property 'obj.value'`, () => {
                expect('obj.value' in node.outputs.caseC.chainProps).toBeTruthy();
            });
        });
        // twoWays
        describe('twoWay case', () => {
            const template = `
                <div
                    [(caseA)]="obj.value"
                    ([caseB])="obj.value"
                />
            `
            const node = parseHTML(template).childNodes[0];
            it(`node.twoWays.caseA.varibles should be has property 'obj'`, () => {
                expect('obj' in node.twoWays.caseA.varibles).toBeTruthy();
            });
            it(`node.twoWays.caseA.chainProps should be has property 'obj.value'`, () => {
                expect('obj.value' in node.twoWays.caseA.chainProps).toBeTruthy();
            });
            it(`node.twoWays.caseB.varibles should be has property 'obj'`, () => {
                expect('obj' in node.twoWays.caseB.varibles).toBeTruthy();
            });
            it(`node.twoWays.caseB.chainProps should be has property 'obj.value'`, () => {
                expect('obj.value' in node.twoWays.caseB.chainProps).toBeTruthy();
            });
        });
        // logics
        describe('logic case', () => {
            const template = `
                <div
                    *for="value in array"
                />
            `
            const node = parseHTML(template).childNodes[0];
            it(`node.logics.*for.varibles should be has property 'value'`, () => {
                expect('value' in node.logics['*for'].varibles).toBeTruthy();
            });
            it(`node.logics.*for.varibles should be has property 'array'`, () => {
                expect('array' in node.logics['*for'].varibles).toBeTruthy();
            });
        });
        // contents
        describe('contents case', () => {
            const template = `
                <div>text</div>
                <div>text{{value}}-{{getValue()}}</div>
            `;
            const ast = parseHTML(template);
            const textNode = ast.childNodes[0].childNodes[0];
            const bindingTextNode = ast.childNodes[1].childNodes[0];
            it(`textNode.contents should be 'text'`, () => {
                expect(textNode.contents).toBe('text');
            });
            it(`bindingTextNode.contents should be array`, () => {
                expect(Array.isArray(bindingTextNode.contents)).toBeTruthy();
                expect(bindingTextNode.contents.length).toBe(4);
            });
            it(`bindingTextNode.contents[0] should be 'text'`, () => {
                expect(bindingTextNode.contents[0]).toBe('text');
            });
            it(`bindingTextNode.contents[1].varibles be has property 'value'`, () => {
                expect('value' in (bindingTextNode.contents[1] as IStatementInfo).varibles).toBeTruthy();
            });
            it(`bindingTextNode.contents[2] should be '-'`, () => {
                expect(bindingTextNode.contents[2]).toBe('-');
            });
            it(`bindingTextNode.contents[3].functions be has property 'getValue'`, () => {
                expect('getValue' in (bindingTextNode.contents[3] as IStatementInfo).functions).toBeTruthy();
            });
        });
        // classInputs
        describe('class binging case', () => {
            const template = `
                <div [class]="getClassNames()" [class.class-name-1]="true" [class.class-name-2]="getValue()"/>
                <div [class]="{'class-name-1': true, 'class-name-2': value, [classNameA]: true, ['classNameB']: value, ['className' + 'C']: 'true' + '' }"/>
            `;
            const ast = parseHTML(template);
            const caseANode = ast.childNodes[0];
            const caseBNode = ast.childNodes[1];
            it(`typeof caseANode.inputs.class should be 'object'`, () => {
                expect(typeof caseANode.inputs.class).toBe('object');
            });
            it(`caseANode.inputs.class.functions should be has property 'getClassNames'`, () => {
                expect('getClassNames' in (caseANode.inputs.class as IStatementInfo).functions).toBeTruthy();
            });
            it(`caseANode.classes should be has property 'class-name-1'`, () => {
                expect('class-name-1' in caseANode.classes).toBeTruthy();
            });
            it(`caseANode.classInputs should be has property 'class-name-2'`, () => {
                expect('class-name-2' in caseANode.classInputs).toBeTruthy();
            });
            it(`caseBNode.classes should be has property 'class-name-1'`, () => {
                expect('class-name-1' in caseBNode.classes).toBeTruthy();
                expect(caseBNode.classes['class-name-1']).toBe(true);
            });
            it(`caseBNode.classInputs should be has property 'class-name-2'`, () => {
                expect('class-name-2' in caseBNode.classInputs).toBeTruthy();
                expect('value' in (caseBNode.classInputs['class-name-2'] as IStatementInfo).varibles).toBe(true);
            });
            it(`caseBNode.classInputs['classNameA'] should be Array`, () => {
                expect(Array.isArray(caseBNode.classInputs['classNameA'])).toBe(true);
                expect('classNameA' in caseBNode.classInputs['classNameA'][0].varibles).toBe(true);
                expect(caseBNode.classInputs['classNameA'][1]).toBe(true);
            });
            it(`caseBNode.classInputs should be has property 'classNameB'`, () => {
                expect('classNameB' in caseBNode.classInputs).toBeTruthy();
                expect('value' in (caseBNode.classInputs['classNameB'] as IStatementInfo).varibles).toBe(true);
            });
            it(`caseBNode.classes should be has property 'classNameC'`, () => {
                expect(caseBNode.classes['classNameC']).toBe(true);
            });
        });
        // styleInputs
        describe('style binging case', () => {
            const template = `
                <div [style]="getStyleSheets()" [style.color]="'#FFFFFF'" [style.fontSize]="getValue()"/>
                <div [style]="{'color': '#FFFFFF', 'font-size': value, [styleNameA]: '100%', [styleNameB]: value}"/>
            `;
            const ast = parseHTML(template);
            const caseANode = ast.childNodes[0];
            const caseBNode = ast.childNodes[1];
            it(`typeof caseANode.inputs.style should be 'object'`, () => {
                expect(typeof caseANode.inputs.style).toBe('object');
            });
            it(`caseANode.inputs.style.functions should be has property 'getStyleSheets'`, () => {
                expect('getStyleSheets' in (caseANode.inputs.style as IStatementInfo).functions).toBeTruthy();
            });
            it(`caseANode.styles should be has property 'color'`, () => {
                expect('color' in caseANode.styles).toBeTruthy();
            });
            it(`caseANode.styleInputs should be has property 'fontSize'`, () => {
                expect('fontSize' in caseANode.styleInputs).toBeTruthy();
            });
            it(`caseBNode.styles should be has property 'color'`, () => {
                expect('color' in caseBNode.styles).toBeTruthy();
                expect(caseBNode.styles['color']).toBe('#FFFFFF');
            });
            it(`caseBNode.styleInputs should be has property 'fontSize'`, () => {
                expect('fontSize' in caseBNode.styleInputs).toBeTruthy();
                expect('value' in (caseBNode.styleInputs['fontSize'] as IStatementInfo).varibles).toBe(true);
            });
            it(`caseBNode.styleInputs['styleNameA'] should be Array`, () => {
                expect(Array.isArray(caseBNode.styleInputs['styleNameA'])).toBe(true);
                expect('styleNameA' in caseBNode.styleInputs['styleNameA'][0].varibles).toBe(true);
                expect(caseBNode.styleInputs['styleNameA'][1]).toBe('100%');
            });
            it(`caseBNode.styleInputs['styleNameB'] should be Array`, () => {
                expect(Array.isArray(caseBNode.styleInputs['styleNameB'])).toBe(true);
                expect('styleNameB' in caseBNode.styleInputs['styleNameB'][0].varibles).toBe(true);
                expect('value' in caseBNode.styleInputs['styleNameB'][1].varibles).toBe(true);
            });
        });
    });
});