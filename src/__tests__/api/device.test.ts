import bcrypt from "bcryptjs";
import { expect } from "chai";
import DeviceModel from "src/db/models/device";
import UserModel from "src/db/models/user";
import supertest from "supertest";
import { createMongooseConnection } from "../__utils__/mongoose";
import { createTestServer } from "../__utils__/server";

describe("POST /device/add", () => {
	createMongooseConnection();

	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	const user = {
		username: "test-user",
		password: "password123"
	};

	beforeEach(async () => {
		const testUser = new UserModel({
			username: user.username,
			passwordHash: bcrypt.hashSync(user.password, 10)
		});
		await testUser.save();
	});

	context("device with name does not exist", () => {
		it("should add device with name and public keys", async () => {
			const res = await request
				.post("/device/add")
				.send({
					name: "Test Device",
					signaturePublicKey: "sfdghhgjkkzlg",
					encryptionPublicKey: "sdfghhjjghfk"
				})
				.auth(user.username, user.password, { type: "basic" })
				.expect(201);

			const devices = await DeviceModel.find().exec();
			expect(devices.length).to.equal(1);
			const device = devices[0];
			expect(device.name).to.equal("Test Device");
			expect(device.type).to.equal(0);
			expect(device.signaturePublicKey).to.equal("sfdghhgjkkzlg");
			expect(device.encryptionPublicKey).to.equal("sdfghhjjghfk");

			expect(res.body).to.deep.equal({
				data: { id: device._id.toHexString() }
			});
		});
	});
});
