import Joi from "joi";
import Koa from "koa";
import bodyValidator from "src/body_validator";
import { mockContext, catchMiddlewareErrors } from "./__utils__/koa_mock";

const testSchema = Joi.object({
	val: Joi.number().required()
});

describe("the bodyValidator() middleware", () => {
	let ctx: Koa.Context;
	let next: Koa.Next;

	beforeEach(() => {
		ctx = mockContext();
		next = jest.fn();
	});

	test("correctly handles empty request bodies", async () => {
		await catchMiddlewareErrors(bodyValidator(testSchema), ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(next).not.toHaveBeenCalled();
	});

	test("correctly handles correct requests", () => {
		ctx.request.body = { val: 69 };
		bodyValidator(testSchema)(ctx, next);
		expect(ctx.status).toEqual(200);
		expect(next).toHaveBeenCalled();
	});

	test("correctly handles incorrect requests", async () => {
		ctx.request.body = { val: "hi!" };
		await catchMiddlewareErrors(bodyValidator(testSchema), ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.anything());
		expect(next).not.toHaveBeenCalled();
	});
});
