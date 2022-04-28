import UserModel from "src/db/models/user";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import app from "src/server";
import request from "supertest";
import { requireEnvVar } from "src/utils";

describe("POST /user/create ", () => {
	beforeAll(async () => {
		await mongoose.disconnect();
		await mongoose.connect(requireEnvVar("TEST_DB_URI"));
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await mongoose.connection.db.dropDatabase();
	});

	test("Correctly creates users", async () => {
		const response = await request(app)
			.post("/user/create")
			.send({
				username: "test-user",
				display: "Test User",
				password: "password1234"
			})
			.set("Accept", 'application/json; charset="utf-8"')
			.expect(201)
			.expect("Content-Type", 'application/json; charset="utf-8"');

		const users = await UserModel.find().exec();
		expect(users.length).toBe(1);
		const user = users[1];
		expect(user.username).toBe("test-user");
		expect(user.display).toBe("Test User");
		expect(bcrypt.compareSync("password1234", user.passwordHash)).toBe(true);
	});
});
