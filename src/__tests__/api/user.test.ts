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
			.set("Accept", "application/json; charset=utf-8")
			.expect(201);
		expect(response.get("Content-Type")).toEqual(
			expect.stringContaining("application/json")
		);

		const users = await UserModel.find().exec();
		expect(users.length).toBe(1);
		const user = users[0];
		expect(user.username).toBe("test-user");
		expect(user.display).toBe("Test User");
		expect(bcrypt.compareSync("password1234", user.passwordHash)).toBe(true);

		expect(response.body).toEqual({ data: { id: user._id.toHexString() } });
	});

	test("Handles duplicate users", async () => {
		const user = new UserModel({
			username: "test_user_2",
			passwordHash: "gsredtzdhrfgjf"
		});
		await user.save();

		const response = await request(app)
			.post("/user/create")
			.send({ username: "test_user_2", password: "fgsdrtghfthjgz" })
			.expect(400);

		expect(response.body).toHaveProperty("error");
		const users = await UserModel.find().exec();
		expect(users.length).toBe(1);
	});
});
