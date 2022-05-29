import Koa from "koa";
import errorHandler from "src/errors";
import createContext from "koa-create-context";
import { SinonSpy, spy } from "sinon";
import { expect } from "chai";

describe("the errorHandler() middleware", () => {
	let ctx: Koa.ParameterizedContext;
	let next: SinonSpy;

	beforeEach(() => {
		ctx = createContext();
		next = spy();
	});

	it("should catch errors", async () => {
		next = spy(() => {
			throw new Error("test");
		});
		expect(() => errorHandler()(ctx, next)).not.to.throw();
		expect(next.calledOnce).to.be.true;
	});

	it("should correctly output thrown error messages", async () => {
		next = spy(() => {
			throw new Error("test");
		});
		await errorHandler()(ctx, next);
		expect(ctx.state.error).to.be.true;
		expect(ctx.body).to.equal("test");
		expect(ctx.status).to.equal(500);
		expect(next.calledOnce).to.be.true;
	});

	it("should correctly output http error messages and status codes", async () => {
		next = spy(() => {
			ctx.throw(418, "test2");
		});
		await errorHandler()(ctx, next);
		expect(ctx.state.error).to.be.true;
		expect(ctx.body).to.equal("test2");
		expect(ctx.status).to.equal(418);
		expect(next.calledOnce).to.be.true;
	});
});
