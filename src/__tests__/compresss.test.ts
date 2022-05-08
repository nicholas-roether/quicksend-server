import zlib from "zlib";
import { expect } from "chai";
import { SinonSpy, spy } from "sinon";
import compress from "src/compress";
import {
	catchMiddlewareErrors,
	MockContext,
	mockContext
} from "./__utils__/koa_mock";

describe("the compress() middleware", () => {
	let ctx: MockContext;
	let next: SinonSpy;

	beforeEach(() => {
		ctx = mockContext();
		next = spy();
	});

	describe("decoding of incoming requests", () => {
		it("should have no effect on requests that do not have a Content-Encoding header", async () => {
			ctx.request.body = "Hello World";
			await compress()(ctx, next);
			expect(ctx.request.body).to.equal("Hello World");
			expect(next.calledOnce).to.be.true;
		});

		it("should throw with code 400 for an unsupported encoding", async () => {
			ctx.request.header["content-encoding"] = "rtzdeftuj";
			await catchMiddlewareErrors(compress(), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(next.called).to.be.false;
		});

		it("should correctly decode gzip-encoded requests", async () => {
			ctx.request.body = zlib.gzipSync("Test Message");
			ctx.request.header["content-encoding"] = "gzip";
			await compress()(ctx, next);
			expect(ctx.request.body).to.equal("Test Message");
			expect(next.calledOnce).to.be.true;
		});

		it("should correctly decode deflate-encoded requests", async () => {
			ctx.request.body = zlib.deflateSync("Test Message");
			ctx.request.header["content-encoding"] = "deflate";
			await compress()(ctx, next);
			expect(ctx.request.body).to.equal("Test Message");
			expect(next.calledOnce).to.be.true;
		});

		it("should correctly decode brotli-encoded requests", async () => {
			ctx.request.body = zlib.brotliCompressSync("Test Message");
			ctx.request.header["content-encoding"] = "br";
			await compress()(ctx, next);
			expect(ctx.request.body).to.equal("Test Message");
			expect(next.calledOnce).to.be.true;
		});

		it("should correctly decode requests encoded with multiple algorithms in sequence", async () => {
			ctx.request.body = zlib.deflateSync(zlib.gzipSync("Test Message"));
			ctx.request.header["content-encoding"] = "gzip, deflate";
			await compress()(ctx, next);
			expect(ctx.request.body).to.equal("Test Message");
			expect(next.calledOnce).to.be.true;
		});
	});

	describe("encoding of outgoing responses", () => {
		it("it should have no effect if the body is empty", async () => {
			ctx.body = undefined;
			ctx.state.compress = true;
			ctx.request.header["accept-encoding"] = "deflate, gzip";
			await compress()(ctx, next);
			expect(ctx.body).to.be.undefined;
			expect(next.calledOnce).to.be.true;
		});

		it("should have no effect if ctx.state.compress is not true", async () => {
			ctx.body = "Test Response";
			await compress()(ctx, next);
			expect(ctx.body).to.equal("Test Response");
			expect(next.calledOnce).to.be.true;
		});

		it("should have no effect if the gzip encoding is not supported by the request", async () => {
			ctx.body = "Test Response";
			ctx.state.compress = true;
			ctx.request.header["accept-encoding"] = "deflate, br";
			await compress()(ctx, next);
			expect(ctx.body).to.equal("Test Response");
			expect(next.calledOnce).to.be.true;
		});

		it("should compress the body with the gzip encoding if the accept-encoding header is not set", async () => {
			ctx.body = "Test Response";
			ctx.state.compress = true;
			await compress()(ctx, next);
			expect(ctx.body).to.be.instanceOf(Buffer);
			expect(zlib.gunzipSync(ctx.body as Buffer).toString()).to.equal(
				"Test Response"
			);
			expect(next.calledOnce).to.be.true;
		});

		it("should compress the body with the gzip encoding if the accept-encoding supports gzip", async () => {
			ctx.body = "Test Response";
			ctx.state.compress = true;
			ctx.request.header["accept-encoding"] = "deflate, gzip";
			await compress()(ctx, next);
			expect(ctx.body).to.be.instanceOf(Buffer);
			expect(zlib.gunzipSync(ctx.body as Buffer).toString()).to.equal(
				"Test Response"
			);
			expect(next.calledOnce).to.be.true;
		});
	});
});
