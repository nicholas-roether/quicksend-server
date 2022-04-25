import Koa from "koa";

function rawResponse(ctx: Koa.Context, body: unknown, status = 200) {
	ctx.status = status;
	ctx.body = body;
}

function jsonResponse(ctx: Koa.Context, json: unknown, status?: number) {
	ctx.type = "json";
	rawResponse(ctx, JSON.stringify(json), status);
}

function errorResponse(ctx: Koa.Context, message: string, status = 500): void {
	jsonResponse(ctx, { error: message }, status);
}

function dataResponse(ctx: Koa.Context, data: unknown, status?: number): void {
	jsonResponse(ctx, { data }, status);
}

export { rawResponse, jsonResponse, errorResponse, dataResponse };
