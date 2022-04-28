import authHandler from "quicksend-server/authorization/handler";
import Koa from "koa";
import mongoose from "mongoose";
import crypto from "crypto";
import { requireEnvVar } from "quicksend-server/config";
import { encodeBase64 } from "quicksend-server/utils";
import UserModel from "quicksend-server/db/models/user";
import bcrypt from "bcryptjs";
import {
	catchMiddlewareErrors,
	mockContext
} from "quicksend-server/__tests__/__utils__/koa_mock";
import DeviceModel from "quicksend-server/db/models/device";
import { generateTestKeys } from "quicksend-server/__tests__/__utils__/rsa";

describe("the authHandler() middleware for Basic auth", () => {
	const handler = authHandler("Basic");
	let ctx: Koa.Context;
	let next: Koa.Next;

	beforeAll(async () => {
		await mongoose.connect(requireEnvVar("TEST_DB_URI"));
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		ctx = mockContext();
		next = jest.fn();
		await mongoose.connection.db.dropDatabase();
	});

	test("Correctly handles unauthorized requests", async () => {
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(401, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(ctx.response.header["www-authenticate"]).toMatch(/^Basic/);
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles malformed authorization headers", async () => {
		ctx.request.header.authorization = "dhtzhfjjhgfkguizk";
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles malformed authorization parameters", async () => {
		ctx.request.header.authorization = "Basic trhjghfjfghjkm";
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles unknown usernames", async () => {
		ctx.request.header.authorization =
			"Basic " + encodeBase64("test-user:password123");
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles invalid passwords", async () => {
		const testUser = new UserModel({
			username: "testuser1234",
			passwordHash: bcrypt.hashSync("password1234", 10)
		});
		await testUser.save();
		ctx.request.header.authorization =
			"Basic " + encodeBase64("testuser1234:password123");
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(401, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles correct credentials", async () => {
		const testUser = new UserModel({
			username: "testuser1234",
			passwordHash: bcrypt.hashSync("password1234", 10)
		});
		await testUser.save();
		ctx.request.header.authorization =
			"Basic " + encodeBase64("testuser1234:password1234");
		await handler(ctx, next);
		expect(ctx.state.user).toEqual({
			id: testUser._id,
			username: "testuser1234",
			display: undefined
		});
		expect(next).toHaveBeenCalled();
	});
});

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

describe("the authHandler() middleware for Signature auth", () => {
	const handler = authHandler();
	let ctx: Koa.Context;
	let next: Koa.Next;

	beforeAll(async () => {
		await mongoose.connect(requireEnvVar("TEST_DB_URI"));
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		ctx = mockContext();
		next = jest.fn();
		await mongoose.connection.db.dropDatabase();
	});

	test("Correctly handles unauthorized requests", async () => {
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toBeCalledWith(401, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(ctx.response.header["www-authenticate"]).toMatch(/^Signature/);
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles malformed authorization headers", async () => {
		ctx.request.header["authorization"] = "gdrfhthfkjkjhlölköj";
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles malformed authorization parameters", async () => {
		ctx.request.header["authorization"] = "Signature val='3";
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correcly verifies correct signatures", async () => {
		const keyPair = generateTestKeys();

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
		ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}"`;

		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).not.toHaveBeenCalled();
		expect(ctx.state.user).toEqual({
			id: user._id,
			username: user.username,
			display: user.display
		});
		expect(next).toHaveBeenCalled();
	});

	test("Correctly handles malformed object ids", async () => {
		ctx.request.header.authorization = 'Signature keyId="fsdgfdg"';
		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(400, expect.any(String));
		expect(next).not.toHaveBeenCalled();
	});

	test("Corretly handles non-existent devices", async () => {
		const keyPair = generateTestKeys();

		const date = new Date();
		const signatureStr = `(request-target): post /test\ndate: ${date.toUTCString()}\n`;
		const signature = crypto
			.sign(null, Buffer.from(signatureStr), keyPair.privateKey)
			.toString("base64");

		ctx.url = "/test";
		ctx.method = "POST";
		ctx.request.header.date = date.toUTCString();
		ctx.request.header.authorization = `Signature keyId="${new mongoose.Types.ObjectId().toHexString()}",signature="${signature}"`;

		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(401, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Correctly handles invalid signatures", async () => {
		const keyPair = generateTestKeys();

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
		ctx.request.header.authorization = `Signature keyId="${device._id.toHexString()}",signature="${signature}"`;

		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).toHaveBeenCalledWith(401, expect.any(String));
		expect(ctx.state.user).toBeUndefined();
		expect(next).not.toHaveBeenCalled();
	});

	test("Allows specifying custom headers", async () => {
		const keyPair = generateTestKeys();

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

		await catchMiddlewareErrors(handler, ctx, next);
		expect(ctx.throw).not.toHaveBeenCalled();
		expect(ctx.state.user).toEqual({
			id: user._id,
			username: user.username,
			display: user.display
		});
		expect(next).toHaveBeenCalled();
	});
});
