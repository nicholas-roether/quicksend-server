import Koa from "koa";

function cors(): Koa.Middleware {
	return (ctx, next) => {
		ctx.set("access-control-allow-origin", "*");
		ctx.set("access-control-allow-headers", "Authorization, *");
		ctx.header.access;
		return next();
	};
}

export default cors;
