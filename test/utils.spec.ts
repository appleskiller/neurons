import * as utils from '../src/utils';

describe('utils', () => {
    function getObject() {
        return {
            types: {
                'null': null,
                'undefined': undefined,
                string: 'string',
                boolean: false,
                number: 3.14,
                date: new Date(),
                array: [1, 2, 3],
                object: {
                    a: {
                        b: {
                            c: 1
                        }
                    }
                }
            }
        };
    }
    describe('isDefined', () => {
        it('null and undefined should be false, NaN/0/""/false should be true', () => {
            const source = getObject();
            expect(utils.isDefined(null)).toBe(false);
            expect(utils.isDefined(undefined)).toBe(false);
            expect(utils.isDefined(NaN)).toBe(true);
            expect(utils.isDefined(0)).toBe(true);
            expect(utils.isDefined('')).toBe(true);
            expect(utils.isDefined(false)).toBe(true);
        });
    });
    describe('merge', () => {
        describe('const target = utils.merge(source)', () => {
            const source = getObject();
            const target = utils.merge(source);
            it('target should be new instance', () => {
                expect(target).toBeTruthy();
            });
            it('target should be not equals source', () => {
                expect(target !== source).toBe(true);
            });
            it('target.types.object.a.b.c should be 1', () => {
                expect(target.types.object.a.b.c).toBe(1);
            });
            it('target.types.array should be not equals source.types.array', () => {
                expect(target.types.array).not.toBe(source.types.array);
            });
        });
        describe('const target = utils.merge(source1, source2)', () => {
            const source1 = getObject();
            const source2 = {
                foo: 'abc',
                types: {
                    array: [{a: 1}]
                }
            };
            const target = utils.merge(source1, source2);
            it('target should be new instance', () => {
                expect(target).toBeTruthy();
            });
            it('target should be not equals source1 and source2', () => {
                expect(target !== source1).toBe(true);
                expect(target !== source2).toBe(true);
            });
            it('target.types.object.a.b.c should be 1', () => {
                expect(target.types.object.a.b.c).toBe(1);
            });
            it('target.foo should be abc', () => {
                expect(target.foo).toBe('abc');
            });
            it('target.types.array[0].a should be 1', () => {
                expect(target.types.array[0].a).toBe(1);
            });
            it('target.types.array.length should be source2.types.array.length', () => {
                expect(target.types.array.length).toBe(source2.types.array.length);
            });
            source1.types.string = utils.merge(true, source1.types.string, 'abc');
            it('source1.types.string should be "abc"', () => {
                expect(source1.types.string).toBe('abc');
            });
        });
        describe('const merged = utils.merge(true, target, source)', () => {
            const source = getObject();
            const target = {};
            const merged = utils.merge(true, target, source);
            it('merged should be equals target', () => {
                expect(merged).toBe(target);
            });
        });
    });
    describe('copyBy', () => {
        describe('copyBy should be same as merge if mappings not setted: const merged = utils.copyBy(target, source)', () => {
            const source = getObject();
            const target: any = {};
            utils.copyTo(target, source);
            it('target should be new instance', () => {
                expect(target).toBeTruthy();
            });
            it('target should be not equals source', () => {
                expect(target !== source).toBe(true);
            });
            it('target.types.object.a.b.c should be 1', () => {
                expect(target.types.object.a.b.c).toBe(1);
            });
            it('target.types.array should be not equals source.types.array', () => {
                expect(target.types.array).not.toBe(source.types.array);
            });
        });
        describe('copyBy should be copy value limited by properties of mappings if mappings setted: const merged = utils.copyBy(target, source, mappings)', () => {
            const source = getObject();
            const target: any = {};
            const mappings = {
                'types.string': '',
                'types.boolean': (value: any) => {
                    return true;
                },
                'types.number': 'copyedTypes.number',
                'types.array': {
                    targetProperty: 'copyedTypes.array'
                },
                'types.object': {
                    targetProperty: 'copyedTypes.object',
                    converter: (value: any) => {
                        return value.a.b.c;
                    }
                }
            };
            utils.copyTo(target, source, mappings);
            it('target should be new instance', () => {
                expect(target).toBeTruthy();
            });
            it('target should be not equals source', () => {
                expect(target !== source).toBe(true);
            });
            it('target.types.string should be source.types.string', () => {
                expect(target.types.string).toBe(source.types.string);
            });
            it('target.types.boolean should be true', () => {
                expect(target.types.boolean).toBe(true);
            });
            it('target.copyedTypes.number should be source.types.number', () => {
                expect(target.copyedTypes.number).toBe(source.types.number);
            });
            it('target.copyedTypes.array should not be source.types.array', () => {
                expect(target.copyedTypes.array !== source.types.array).toBeTruthy();
            });
            it('target.copyedTypes.array[1] should be source.types.array[1]', () => {
                expect(target.copyedTypes.array[1] === source.types.array[1]).toBeTruthy();
            });
            it('target.copyedTypes.object should be source.types.object.a.b.c', () => {
                expect(target.copyedTypes.object).toBe(source.types.object.a.b.c);
            });
        });
    });
    describe('isBrowser', () => {
        it('should be truthy', () => {
            expect(utils.isBrowser).toBe(true);
        });
    });
});