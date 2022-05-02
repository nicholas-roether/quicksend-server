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

describe("POST /user/create", function () {
	createMongooseConnection();

	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should abort with 400 response if username is missing", async () => {
		request.post("/user/create").send({ password: "1234" }).expect(400);
		const users = await UserModel.find().exec();
		expect(users.length).to.equal(0);
	});

	it("should abort with 400 response if password is missing", async () => {
		request.post("/user/create").send({ username: "1234" }).expect(400);
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

	it("should respond with 401 to unauthorized requests", async () => {
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

		it("should return the correct user data", async () => {
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
