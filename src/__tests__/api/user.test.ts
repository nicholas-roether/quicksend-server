import { expect } from "chai";
import UserModel from "src/db/models/user";
import supertest from "supertest";
import bcrypt from "bcryptjs";
import { createMongooseConnection } from "../__utils__/mongoose";
import { createTestServer } from "../__utils__/server";
import { User } from "src/db/schemas/user";
import { createSigner, Signer } from "../__utils__/signature";
import { generateTestKeys } from "../__utils__/rsa";
import DeviceModel from "src/db/models/device";
import mongoose from "mongoose";

describe("POST /user/create", function () {
	createMongooseConnection();

	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should abort with 400 response if username is missing", async () => {
		await request.post("/user/create").send({ password: "1234" }).expect(400);
		const users = await UserModel.find().exec();
		expect(users.length).to.equal(0);
	});

	it("should abort with 400 response if password is missing", async () => {
		await request.post("/user/create").send({ username: "1234" }).expect(400);
		const users = await UserModel.find().exec();
		expect(users.length).to.equal(0);
	});

	context("no user with name exists", () => {
		it("should create new user with username and password", async () => {
			const res = await request
				.post("/user/create")
				.send({ username: "test-user", password: "password123" })
				.expect(201);
			expect(res.get("Content-Type")).to.contain("application/json");

			const users = await UserModel.find().exec();
			expect(users.length).to.equal(1);
			const user = users[0];
			expect(user.username).to.equal("test-user");
			expect(bcrypt.compareSync("password123", user.passwordHash)).to.be.true;

			expect(res.body).to.deep.equal({ data: { id: user._id.toHexString() } });
		});

		it("should create new user with username, display name and password", async () => {
			const res = await request
				.post("/user/create")
				.send({
					username: "test-user-2",
					display: "Test User #2",
					password: "password1234"
				})
				.expect(201);
			expect(res.get("Content-Type")).to.contain("application/json");

			const users = await UserModel.find().exec();
			expect(users.length).to.equal(1);
			const user = users[0];
			expect(user.username).to.equal("test-user-2");
			expect(user.display).to.equal("Test User #2");
			expect(bcrypt.compareSync("password1234", user.passwordHash)).to.be.true;

			expect(res.body).to.deep.equal({ data: { id: user._id.toHexString() } });
		});
	});

	context("user with name already exists", () => {
		beforeEach(async () => {
			const user = new UserModel({
				username: "test_user_2",
				passwordHash: "gsredtzdhrfgjf"
			});
			await user.save();
		});

		it("should return 400 and not create new users", async () => {
			const response = await request
				.post("/user/create")
				.send({ username: "test_user_2", password: "fgsdrtghfthjgz" })
				.expect(400);

			expect(response.body).to.have.property("error");
			const users = await UserModel.find().exec();
			expect(users.length).to.equal(1);
		});
	});
});

describe("GET /user/info", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;
	let testUser: User;

	before(() => {
		request = supertest(createTestServer());
	});

	beforeEach(async () => {
		const user = new UserModel({
			username: "some_test_user",
			display: "Some Test User",
			passwordHash: "dfsgfjdghjhgf"
		});
		await user.save();
		testUser = user;
	});

	it("should return 400 for invalid user IDs", async () => {
		await request.get("/user/info/fdgsdf ghjjgfkhz").expect(400);
	});

	it("should return the correct data for a provided ID", async () => {
		const user2 = new UserModel({
			username: "some-other-user",
			display: "fdgshfgdjhgjf",
			passwordHash: "fgsdghjffghjkgjhk"
		});
		await user2.save();

		const response = await request
			.get(`/user/info/${user2._id.toHexString()}`)
			.expect(200);
		expect(response.body).to.deep.equal({
			data: {
				id: user2._id.toHexString(),
				username: user2.username,
				display: user2.display
			}
		});
	});

	it("should return null for user IDs that do not exist", async () => {
		const response = await request
			.get(`/user/info/${new mongoose.Types.ObjectId().toHexString()}`)
			.expect(204);
		expect(response.body.data).to.be.undefined;
	});

	it("should respond with 401 to unauthenticated requests if no ID is provided", async () => {
		const response = await request.get("/user/info").expect(401);
		expect(response).to.not.have.property("data");
	});

	context("with Signature authorization", () => {
		const testKeypair = generateTestKeys();
		let sign: Signer;

		beforeEach(async () => {
			const testDevice = new DeviceModel({
				name: "Test Device",
				user: testUser._id,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "dfsghhfgjhkgjkhlhjlkö"
			});
			await testDevice.save();

			sign = createSigner("get /user/info", testDevice, testKeypair.privateKey);
		});

		it("should return the correct user data for the authenticated user", async () => {
			const response = await sign(request.get("/user/info")).expect(200);
			expect(response.body).to.deep.equal({
				data: {
					id: testUser._id.toHexString(),
					username: testUser.username,
					display: testUser.display
				}
			});
		});
	});
});

describe("GET /user/find", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should return null if the user doesn't exsit", async () => {
		const res = await request.get("/user/find/test-user").expect(204);
		expect(res.body.data).to.be.undefined;
	});

	it("should return the correct user data if the user exsists", async () => {
		const user = new UserModel({
			username: "test-user",
			passwordHash: "fgsgdfhhjgf",
			display: "sfdgghfd hjtfg"
		});
		await user.save();
		const res = await request.get("/user/find/test-user").expect(200);
		expect(res.body).to.deep.equal({
			data: {
				id: user._id.toHexString(),
				username: user.username,
				display: user.display
			}
		});
	});
});
