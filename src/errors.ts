import assert from "assert";
import Koa from "koa";
import { errorResponse } from "./response";

const errorMiddleware: Koa.Middleware = async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		assert(
			err instanceof Error,
			`Unexpected thrown object of type ${typeof err}`
		);
		errorResponse(
			ctx,
			err.message,
			err instanceof Koa.HttpError ? err.status : 500
		);
		if (ctx.status == 500) ctx.app.emit("error", err);
	}
};

export default errorMiddleware;
