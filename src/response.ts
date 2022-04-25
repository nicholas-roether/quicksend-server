import Koa from "koa";
type ResponseObject = { data: unknown } | { error: string };

const serializers: Record<string, (obj: unknown) => string> = {
	json: (obj) => JSON.stringify(obj)
};

const responseHandler: Koa.Middleware = async (ctx, next) => {
	await next();
	let resObj: ResponseObject | null = null;
	if (ctx.state.error) resObj = { error: ctx.body };
	else resObj = { data: ctx.body };
	const format = ctx.accepts(...Object.keys(serializers));
	if (!format) {
		ctx.status = 406;
		ctx.type = "text/plain";
		ctx.body = "No supported content type found";
		return;
	}
	ctx.type = format;
	ctx.body = serializers[format](resObj);
};

export default responseHandler;
