import * as de from '../lib';

describe('lifecycle', () => {

    it('inheritance', async() => {
        let actionResult;
        const actionSpy = jest.fn<any, any>(() => {
            actionResult = {
                a: 1,
            };
            return actionResult;
        });

        let parentParamsResult;
        const parentParamsSpy = jest.fn<any, any>(() => {
            parentParamsResult = {
                b: 2,
            };
            return parentParamsResult;
        });

        const parentBeforeSpy = jest.fn();

        let parentAfterResult;
        const parentAfterSpy = jest.fn<any, any>(() => {
            parentAfterResult = {
                c: 3,
            };
            return parentAfterResult;
        });

        const parent = de.func({
            block: actionSpy,
            options: {
                params: parentParamsSpy,
                before: parentBeforeSpy,
                after: parentAfterSpy,
            },
        });

        let childParamsResult;
        const childParamsSpy = jest.fn<any, any>(() => {
            childParamsResult = {
                d: 4,
            };
            return childParamsResult;
        });

        const childBeforeSpy = jest.fn();

        let childAfterResult;
        const childAfterSpy = jest.fn<any, any>(() => {
            childAfterResult = {
                e: 5,
            };
            return childAfterResult;
        });

        const child = parent.extend({
            options: {
                params: childParamsSpy,
                before: childBeforeSpy,
                after: childAfterSpy,
            },
        });

        const params = {
            foo: 42,
        };
        const result = await de.run(child, { params });

        expect(childParamsSpy.mock.calls[ 0 ][ 0 ].params).toBe(params);
        expect(childBeforeSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(parentParamsSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(parentBeforeSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(actionSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(parentAfterSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(parentAfterSpy.mock.calls[ 0 ][ 0 ].result).toBe(actionResult);
        expect(childAfterSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(childAfterSpy.mock.calls[ 0 ][ 0 ].result).toBe(parentAfterResult);
        expect(result).toBe(childAfterResult);
    });

});
