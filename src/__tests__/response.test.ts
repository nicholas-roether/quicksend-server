import { expect } from "chai";
import Koa from "koa";
import { SinonSpy, spy } from "sinon";
import response from "src/response";
import { mockContext } from "./__utils__/koa_mock";

describe("the response() middleware", () => {
	let ctx: Koa.ParameterizedContext;
	let next: SinonSpy;

	beforeEach(() => {
		ctx = mockContext();
		next = spy();
	});

	it("should handle empty response bodies", async () => {
		await response()(ctx, next);
		expect(ctx.body).to.equal("{}");
		expect(ctx.status).to.equal(200);
		expect(next.calledOnce).to.be.true;
	});

	it("should serialize the response body", async () => {
		ctx.body = { val: 69 };
		ctx.status = 201;
		await response()(ctx, next);
		expect(ctx.body).to.equal('{"data":{"val":69}}');
		expect(ctx.status).to.equal(201);
		expect(next.calledOnce).to.be.true;
	});

	it("should handle error responses", async () => {
		ctx.body = "Test error";
		ctx.status = 404;
		ctx.state.error = true;
		await response()(ctx, next);
		expect(ctx.body).to.equal('{"error":"Test error"}');
		expect(ctx.status).to.equal(404);
		expect(next.calledOnce).to.be.true;
	});

	it("should handles content negotiation", async () => {
		ctx.request.headers.accept = "text/html";
		ctx.body = "bla bla";
		await response()(ctx, next);
		expect(ctx.status).to.equal(406);
		expect(next.called).to.be.false;
	});

	it("should conform to utf-8 charset specifications", async () => {
		ctx.request.headers.accept = "application/json; charset=utf-8";
		ctx.body = "test test";
		await response()(ctx, next);
		expect(ctx.status).to.equal(200);
		expect(ctx.body).to.equal('{"data":"test test"}');
		expect(next.called).to.be.true;
	});

	it("should return error when receiving non-utf-8 charset specification", async () => {
		ctx.request.headers.accept = "application/json; charset=utf16";
		ctx.body = "test test";
		await response()(ctx, next);
		expect(ctx.status).to.equal(406);
		expect(next.called).to.be.false;
	});
});
