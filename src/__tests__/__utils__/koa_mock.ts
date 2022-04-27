import Koa from "koa";
import createContext from "koa-create-context";

class MockMiddlewareThrow extends Error {
	constructor() {
		super("");
	}
}

function mockContext(): Koa.Context {
	const ctx = createContext();
	ctx.throw = jest.fn(() => {
		throw new MockMiddlewareThrow();
	});
	return ctx;
}

async function catchMiddlewareErrors(
	middleware: Koa.Middleware,
	ctx: Koa.Context,
	next: Koa.Next
) {
	try {
		await middleware(ctx, next);
	} catch (err) {
		if (!(err instanceof MockMiddlewareThrow)) throw err;
	}
}

export { mockContext, catchMiddlewareErrors };
