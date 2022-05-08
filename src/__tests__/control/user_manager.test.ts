import bcrypt from "bcryptjs";
import { assert, expect } from "chai";
import userManager from "src/control/user_manager";
import UserModel from "src/db/models/user";
import { createMongooseConnection } from "../__utils__/mongoose";

describe("The user manager", () => {
	createMongooseConnection();

	describe("usernameExists()", () => {
		it("should return false if the username does not exist", async () => {
			const exists = await userManager.usernameExists("some_username");
			expect(exists).to.be.false;
		});

		it("should return true if the username does exist", async () => {
			const testUser = new UserModel({
				username: "some_username",
				passwordHash: "sdfggfhjkk"
			});
			await testUser.save();

			const exists = await userManager.usernameExists("some_username");
			expect(exists).to.be.true;
		});
	});

	describe("findUsername()", async () => {
		it("should return null if the user does not exist", async () => {
			const ctr = await userManager.findUsername("some_username");
			expect(ctr).to.be.null;
		});

		it("should return the correct user if it exists", async () => {
			const testUser = new UserModel({
				username: "some_username",
				passwordHash: "sdfggfhjkk"
			});
			await testUser.save();

			const ctr = await userManager.findUsername("some_username");
			assert(ctr != null);
			expect(ctr.id.equals(testUser.id)).to.be.true;
			expect(ctr.get("username")).to.equal(testUser.username);
			expect(ctr.get("passwordHash")).to.equal(testUser.passwordHash);
		});
	});

	describe("createUser()", () => {
		it("should create users correctly", async () => {
			await userManager.createUser("test_user", "pwd123", "Test User");

			const users = await UserModel.find().exec();
			expect(users.length).to.equal(1);
			const user = users[0];
			expect(user.username).to.equal("test_user");
			expect(user.display).to.equal("Test User");
			expect(bcrypt.compareSync("pwd123", user.passwordHash)).to.be.true;
		});
	});
});
