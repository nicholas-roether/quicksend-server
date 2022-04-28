import Koa from "koa";
import errorHandler from "src/errors";
import createContext from "koa-create-context";

describe("the errorHandler() middleware", () => {
	let ctx: Koa.Context;
	let next: Koa.Next;

	beforeEach(() => {
		ctx = createContext();
		next = jest.fn();
	});

	afterEach(() => {
		expect(next).toHaveBeenCalled();
	});

	test("catches errors", async () => {
		next = jest.fn(async () => {
			throw new Error("test");
		});
		expect(() => errorHandler()(ctx, next)).not.toThrow();
	});

	test("correctly handles thrown errors", async () => {
		next = jest.fn(async () => {
			throw new Error("test");
		});
		await errorHandler()(ctx, next);
		expect(ctx.state.error).toEqual(true);
		expect(ctx.body).toEqual("test");
		expect(ctx.status).toEqual(500);
	});

	test("correctly handles http errors", async () => {
		next = jest.fn(async () => {
			ctx.throw(418, "test2");
		});
		await errorHandler()(ctx, next);
		expect(ctx.state.error).toEqual(true);
		expect(ctx.body).toEqual("test2");
		expect(ctx.status).toEqual(418);
	});
});
