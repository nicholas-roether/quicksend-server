import Koa from "koa";
import response from "src/response";
import { mockContext } from "./__utils__/koa_mock";

describe("the response() middleware", () => {
	let ctx: Koa.Context;
	let next: Koa.Next;

	beforeEach(() => {
		ctx = mockContext();
		next = jest.fn();
	});

	test("Handles empty response bodies", async () => {
		await response()(ctx, next);
		expect(ctx.body).toEqual("{}");
		expect(ctx.status).toEqual(200);
		expect(next).toHaveBeenCalled();
	});

	test("Handles response body serialization", async () => {
		ctx.body = { val: 69 };
		ctx.status = 201;
		await response()(ctx, next);
		expect(ctx.body).toEqual('{"data":{"val":69}}');
		expect(ctx.status).toEqual(201);
		expect(next).toHaveBeenCalled();
	});

	test("Handles error responses", async () => {
		ctx.body = "Test error";
		ctx.status = 404;
		ctx.state.error = true;
		await response()(ctx, next);
		expect(ctx.body).toEqual('{"error":"Test error"}');
		expect(ctx.status).toEqual(404);
		expect(next).toHaveBeenCalled();
	});

	test("Handles content negotiation", async () => {
		ctx.request.headers.accept = "text/html";
		ctx.body = "bla bla";
		await response()(ctx, next);
		expect(ctx.status).toEqual(406);
		expect(next).not.toHaveBeenCalled();
	});

	test("Ignores charset specifications", async () => {
		ctx.request.headers.accept = "application/json; charset=utf-8";
		ctx.body = "test test";
		await response()(ctx, next);
		expect(ctx.status).toEqual(200);
		expect(ctx.body).toEqual('{"data":"test test"}');
		expect(next).toHaveBeenCalled();
	});
});
