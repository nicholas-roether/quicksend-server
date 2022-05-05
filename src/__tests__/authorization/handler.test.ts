import "src/config";
import authHandler from "src/auth/handler";
import mongoose from "mongoose";
import crypto from "crypto";
import { encodeBase64 } from "src/utils";
import UserModel from "src/db/models/user";
import bcrypt from "bcryptjs";
import {
	catchMiddlewareErrors,
	MockContext,
	mockContext
} from "src/__tests__/__utils__/koa_mock";
import DeviceModel from "src/db/models/device";
import { generateTestKeys } from "src/__tests__/__utils__/rsa";
import { SinonSpy, spy } from "sinon";
import { createMongooseConnection } from "../__utils__/mongoose";
import { expect } from "chai";

async function createTestUser() {
	const user = new UserModel({
		username: "test-user",
		passwordHash: "grfgjkhhgjk"
	});
	await user.save();
	return user;
}

async function createTestDevice(
	userId: mongoose.Types.ObjectId,
	keyPair: crypto.KeyPairSyncResult<string, string>
) {
	const device = new DeviceModel({
		name: "test-device",
		user: userId,
		signaturePublicKey: keyPair.publicKey,
		encryptionPublicKey: "gdhffhjngjfkhjkg"
	});
	await device.save();
	return device;
}

describe("the authHandler() middleware", function () {
	let ctx: MockContext;
	let next: SinonSpy;

	createMongooseConnection();

	beforeEach(() => {
		ctx = mockContext();
		next = spy();
	});

	describe("Basic authorization", () => {
		it("should abort with a 401 response and send appropriate WWW-Authenticate header on requests without an authorization header", async () => {
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.response.header["www-authenticate"]).to.match(/^Basic/);
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response when the authorization header does not begin with 'Basic'", async () => {
			ctx.request.header.authorization = "dhtzhfjjhgfkguizk";
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response when the authorization token is malformed", async () => {
			ctx.request.header.authorization = "Basic dhtzhfjjhgfkguizk";
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response for unknown usernames", async () => {
			ctx.request.header.authorization =
				"Basic " + encodeBase64("test-user:password123");
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 401 response for invalid passwords", async () => {
			const testUser = new UserModel({
				username: "testuser1234",
				passwordHash: bcrypt.hashSync("password1234", 10)
			});
			await testUser.save();
			ctx.request.header.authorization =
				"Basic " + encodeBase64("testuser1234:password123");
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should authorize requests with correct credentials", async () => {
			const testUser = new UserModel({
				username: "testuser1234",
				passwordHash: bcrypt.hashSync("password1234", 10)
			});
			await testUser.save();
			ctx.request.header.authorization =
				"Basic " + encodeBase64("testuser1234:password1234");
			await catchMiddlewareErrors(authHandler("Basic"), ctx, next);
			expect(ctx.status).to.equal(200);
			expect(ctx.state.user).to.deep.equal({
				id: testUser._id,
				username: "testuser1234",
				display: undefined
			});
			expect(next.calledOnce).to.be.true;
		});
	});

	describe("Signature authorization", () => {
		const keyPair = generateTestKeys();

		it("should abort with a 401 response and send appropriate WWW-Authenticate header on requests without an authorization header", async () => {
			await catchMiddlewareErrors(authHandler(), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(ctx.response.header["www-authenticate"]).to.match(/^Signature/);
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response when the authorization header does not begin with 'Signature'", async () => {
			ctx.request.header.authorization = "dhtzhfjjhgfkguizk";
			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response when the authorization parameters are malformed", async () => {
			ctx.request.header.authorization =
				"Signature keyId='ghfhgjgj',signature='sgfd\"";
			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 401 response when the device id used isn't registered", async () => {
			const date = new Date();
			const signatureStr = `(request-target): post /test\ndate: ${date.toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "POST";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${new mongoose.Types.ObjectId().toHexString()}",signature="${signature}",headers="(request-target) date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 400 response when the device id used is not a valid object id", async () => {
			ctx.request.header.authorization = 'Signature keyId="fsdgfdg"';
			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should abort with a 401 response when the signature recieved is invalid", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date();
			const signatureStr = `tzuztuikdfgdhfguhrstztfzuj`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});
		it("should not authorize requests from the future", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date(Date.now() + 10000);
			const signatureStr = `(request-target): post /test\ndate: ${date.toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should not authorize requests older than 1 second", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date(Date.now() - 1000);
			const signatureStr = `(request-target): post /test\ndate: ${date.toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(401)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should not authorize requests that don't specify the headers parameter", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date();
			const signatureStr = `date: ${new Date().toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("should authorize requests with correct signatures", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date();
			const signatureStr = `(request-target): get /test\ndate: ${date.toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.called).to.be.false;
			expect(ctx.state.user).to.deep.equal({
				id: user._id,
				username: user.username,
				display: user.display
			});
			expect(ctx.state.device).to.be.instanceOf(mongoose.Types.ObjectId);
			expect(ctx.state.device.equals(device._id)).to.be.true;
			expect(next.calledOnce).to.be.true;
		});

		it("should allow specification of custom signed headers", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date();
			const signatureStr = `(request-target): get /test\ndate: ${date.toUTCString()}\nx-test: test\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header["x-test"] = "test";
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date x-test"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.called).to.be.false;
			expect(ctx.state.user).to.deep.equal({
				id: user._id,
				username: user.username,
				display: user.display
			});
			expect(ctx.state.device).to.be.instanceOf(mongoose.Types.ObjectId);
			expect(ctx.state.device.equals(device._id)).to.be.true;
			expect(next.calledOnce).to.be.true;
		});

		it("Should require the request target to be included in the signature string", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const date = new Date();
			const signatureStr = `date: ${date.toUTCString()}\n`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.date = date.toUTCString();
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="date"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});

		it("Should require the date header to be included in the signature string", async () => {
			const user = await createTestUser();
			const device = await createTestDevice(user._id, keyPair);

			const signatureStr = `(request-target): get /test`;
			const signature = crypto
				.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
				.toString("base64");

			ctx.url = "/test";
			ctx.method = "GET";
			ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target)"`;

			await catchMiddlewareErrors(authHandler("Signature"), ctx, next);
			expect(ctx.throw.calledOnceWith(400)).to.be.true;
			expect(ctx.state.user).to.be.undefined;
			expect(ctx.state.device).to.be.undefined;
			expect(next.called).to.be.false;
		});
	});
});
