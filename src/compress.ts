import zlib from "zlib";
import Koa from "koa";

function decompressRequests(ctx: Koa.Context) {
	const encodingHeader = ctx.get("Content-Encoding");
	if (!encodingHeader) return;
	const encodings = encodingHeader.replace(/ /g, "").split(",");
	let body: Buffer = Buffer.from(ctx.request.body);
	for (const encoding of encodings) {
		switch (encoding) {
			case "gzip":
				body = zlib.gunzipSync(body);
				break;
			case "deflate":
				body = zlib.inflateSync(body);
				break;
			case "br":
				body = zlib.brotliDecompressSync(body);
				break;
			default:
				return ctx.throw(400, "Unsupported content encoding");
		}
	}
	ctx.request.body = body.toString();
}

function acceptsEncoding(ctx: Koa.Context, encoding: string): boolean {
	const aeHeader = ctx.get("Accept-Encoding");
	if (!aeHeader) return true;
	const options = aeHeader.replace(/ /g, "").split(",");
	for (const option of options) {
		const [encName] = option.split(";");
		if (encName == encoding || encName == "*") return true;
	}
	return false;
}

function compressResponse(ctx: Koa.Context) {
	if (!ctx.state.compress) return;
	if (!acceptsEncoding(ctx, "gzip")) return;

	let body: Buffer;
	if (ctx.body instanceof Buffer) body = ctx.body;
	else if (typeof ctx.body == "string") body = Buffer.from(ctx.body);
	else return;

	ctx.body = zlib.gzipSync(body);
	ctx.set("Content-Encoding", "gzip");
}

function compress(): Koa.Middleware {
	return async (ctx, next) => {
		decompressRequests(ctx);
		await next();
		compressResponse(ctx);
	};
}

export default compress;
