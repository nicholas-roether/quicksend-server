import Koa from "koa";
import { SinonSpy, spy } from "sinon";
import createContext from "koa-create-context";

class MockMiddlewareThrow extends Error {
	constructor() {
		super("");
	}
}

type MockContext = Koa.ParameterizedContext & { throw: SinonSpy };

function mockContext(): MockContext {
	const ctx = createContext();
	ctx.throw = spy(() => {
		throw new MockMiddlewareThrow();
	});
	ctx.request.body = undefined;
	return ctx as MockContext;
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
export type { MockContext };
