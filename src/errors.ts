import assert from "assert";
import Koa from "koa";

function errorHandler(): Koa.Middleware {
	return async (ctx, next) => {
		try {
			await next();
		} catch (err) {
			assert(
				err instanceof Error,
				`Unexpected thrown object of type ${typeof err}`
			);
			ctx.state.error = true;
			ctx.status = err instanceof Koa.HttpError ? err.status : 500;
			ctx.body = err.message;
			if (ctx.status == 500) ctx.app.emit("error", err);
		}
	};
}

export default errorHandler;
