import { expect } from "chai";
import UserModel from "src/db/models/user";
import supertest from "supertest";
import bcrypt from "bcryptjs";
import { createMongooseConnection } from "../__utils__/mongoose";
import { createTestServer } from "../__utils__/server";

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
