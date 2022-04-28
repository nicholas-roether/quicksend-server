import "src/config";
import supertest from "supertest";
import bcrypt from "bcryptjs";
import server from "src/server";
import mongoose from "mongoose";
import { requireEnvVar } from "src/utils";
import UserModel from "src/db/models/user";
import DeviceModel from "src/db/models/device";

const request = supertest(server);

describe("POST /device/add", () => {
	const user = {
		username: "test-user",
		password: "password123"
	};

	beforeAll(async () => {
		await mongoose.disconnect();
		await mongoose.connect(requireEnvVar("TEST_DB_URI"));
		await mongoose.connection.db.dropDatabase();
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		const testUser = new UserModel({
			username: user.username,
			passwordHash: bcrypt.hashSync(user.password, 10)
		});
		await testUser.save();
	});

	afterEach(async () => {
		await mongoose.connection.db.dropDatabase();
	});

	test("Correctly adds devices", async () => {
		const response = await request
			.post("/device/add")
			.send({
				name: "Test Device",
				signaturePublicKey: "sfdghhgjkkzlg",
				encryptionPublicKey: "sdfghhjjghfk"
			})
			.auth(user.username, user.password)
			.expect(201);

		const devices = await DeviceModel.find().exec();
		expect(devices.length).toBe(1);
		const device = devices[0];
		expect(device.name).toBe("Test Device");
		expect(device.type).toBe(0);
		expect(device.signaturePublicKey).toBe("sfdghhgjkkzlg");
		expect(device.encryptionPublicKey).toBe("sdfghhjjghfk");

		expect(response.body).toEqual({ data: { id: device._id.toHexString() } });
	});
});
