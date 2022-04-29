import { expect } from "chai";
import Joi from "joi";
import { SinonSpy, spy } from "sinon";
import bodyValidator from "src/body_validator";
import {
	mockContext,
	catchMiddlewareErrors,
	MockContext
} from "./__utils__/koa_mock";

const testSchema = Joi.object({
	val: Joi.number().required()
});

describe("the bodyValidator() middleware", () => {
	let ctx: MockContext;
	let next: SinonSpy;

	beforeEach(() => {
		ctx = mockContext();
		next = spy();
	});

	it("should throw error on empty request body", async () => {
		await catchMiddlewareErrors(bodyValidator(testSchema), ctx, next);
		expect(ctx.throw.calledOnceWith(400)).to.be.true;
		expect(next.called).to.be.false;
	});

	it("should pass on correct request bodies", () => {
		ctx.request.body = { val: 69 };
		bodyValidator(testSchema)(ctx, next);
		expect(ctx.status).to.equal(200);
		expect(next.calledOnce).to.be.true;
	});

	it("should throw on incorrect request bodies", async () => {
		ctx.request.body = { val: "hi!" };
		await catchMiddlewareErrors(bodyValidator(testSchema), ctx, next);
		expect(ctx.throw.calledOnceWith(400)).to.be.true;
		expect(next.called).to.be.false;
	});
});
