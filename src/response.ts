import Koa from "koa";
type ResponseObject = { data: unknown } | { error: string };

const serializers: Record<string, (obj: unknown) => string> = {
	json: (obj) => JSON.stringify(obj)
};

function handleCharset(ctx: Koa.ParameterizedContext): boolean {
	const acceptHeader = ctx.get("Accept");
	if (!acceptHeader) return true;
	const [accept, param] = acceptHeader.split(";");
	ctx.request.header.accept = accept;
	if (!param) return true;
	const match = param.match(/charset=([a-z0-9_-]+)/i);
	if (match) {
		const charset = match[1];
		if (!/^utf-?8$/i.test(charset)) {
			ctx.status = 406;
			ctx.body = "Encoding not supported";
			return false;
		}
	}
	return true;
}

function getFormat(ctx: Koa.ParameterizedContext): string | null {
	const format = ctx.accepts(...Object.keys(serializers));
	if (!format) {
		ctx.status = 406;
		ctx.body = "No supported content type found";
		return null;
	}
	return format;
}

function serializeResponse(ctx: Koa.ParameterizedContext, format: string) {
	let resObj: ResponseObject | null = null;
	if (ctx.state.error) resObj = { error: String(ctx.body) };
	else resObj = { data: ctx.body };
	ctx.type = format;
	ctx.body = serializers[format](resObj);
}

function responseHandler(): Koa.Middleware {
	return async (ctx, next) => {
		if (!handleCharset(ctx)) return next();

		await next();

		if (ctx.state.rawResponse) return;
		const format = getFormat(ctx);
		if (!format) return;
		serializeResponse(ctx, format);
	};
}

export default responseHandler;
