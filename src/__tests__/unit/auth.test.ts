import authHandler from "auth";
import Koa from "koa";
import createContext from "koa-create-context";
import mongoose from "mongoose";
import { requireEnvVar } from "config";
import { encodeBase64 } from "utils";
import UserModel from "db/models/user";
import bcrypt from "bcryptjs";
import {
	catchMiddlewareErrors,
	mockContext
} from "__tests__/__utils__/koa_mock";

describe("the authHandler() middleware for Basic auth", () => {
	const handler = authHandler({ authType: "Basic" });
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
		expect(ctx.response.header["www-authenticate"]).toEqual(
			'Basic, charset="utf-8"'
		);
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
