import bcrypt from "bcryptjs";
import { expect } from "chai";
import DeviceModel from "src/db/models/device";
import UserModel from "src/db/models/user";
import { User } from "src/db/schemas/user";
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
	let testUser: User;

	beforeEach(async () => {
		const testUserDoc = new UserModel({
			username: user.username,
			passwordHash: bcrypt.hashSync(user.password, 10)
		});
		await testUserDoc.save();
		testUser = testUserDoc;
	});

	it("should require a value for name", async () => {
		await request
			.post("/device/add")
			.send({
				signaturePublicKey: "sfaggfdhs",
				encryptionPublicKey: "sghdffdghjhfgdj"
			})
			.auth(user.username, user.password, { type: "basic" })
			.expect(400);
	});

	it("should require a value for signaturePublicKey", async () => {
		await request
			.post("/device/add")
			.send({
				name: "sfaggfdhs",
				encryptionPublicKey: "sghdffdghjhfgdj"
			})
			.auth(user.username, user.password, { type: "basic" })
			.expect(400);
	});

	it("should require a value for encryptionPublicKey", async () => {
		await request
			.post("/device/add")
			.send({
				name: "sdfdsgfh",
				signaturePublicKey: "sfaggfdhs"
			})
			.auth(user.username, user.password, { type: "basic" })
			.expect(400);
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

		it("should add device with name, type and public keys", async () => {
			const res = await request
				.post("/device/add")
				.send({
					name: "Test Device",
					type: 2,
					signaturePublicKey: "sfdghhgjkkzlg",
					encryptionPublicKey: "sdfghhjjghfk"
				})
				.auth(user.username, user.password, { type: "basic" })
				.expect(201);

			const devices = await DeviceModel.find().exec();
			expect(devices.length).to.equal(1);
			const device = devices[0];
			expect(device.name).to.equal("Test Device");
			expect(device.type).to.equal(2);
			expect(device.signaturePublicKey).to.equal("sfdghhgjkkzlg");
			expect(device.encryptionPublicKey).to.equal("sdfghhjjghfk");

			expect(res.body).to.deep.equal({
				data: { id: device._id.toHexString() }
			});
		});
	});

	context("device with name already exists for user", () => {
		beforeEach(async () => {
			const device = new DeviceModel({
				name: "Test Device",
				user: testUser._id,
				signaturePublicKey: "restghjgdf",
				encryptionPublicKey: "tshghjghjf"
			});
			await device.save();
		});
		it("should return a 400 response and not add a device", async () => {
			await request
				.post("/device/add")
				.send({
					name: "Test Device",
					signaturePublicKey: "sfdghhgjkkzlg",
					encryptionPublicKey: "sdfghhjjghfk"
				})
				.auth(user.username, user.password, { type: "basic" })
				.expect(400);

			const devices = await DeviceModel.find().exec();
			expect(devices.length).to.equal(1);
			const device = devices[0];
			expect(device.name).to.equal("Test Device");
			expect(device.type).to.equal(0);
			expect(device.signaturePublicKey).not.to.equal("sfdghhgjkkzlg");
			expect(device.encryptionPublicKey).not.to.equal("sdfghhjjghfk");
		});
	});

	context("device with name exists for different user", () => {
		beforeEach(async () => {
			const testUser2 = new UserModel({
				username: "test-user-2",
				passwordHash: "r gdhzfjtjfhk"
			});
			const device = new DeviceModel({
				name: "Test Device",
				user: testUser2._id,
				signaturePublicKey: "restghjgdf",
				encryptionPublicKey: "tshghjghjf"
			});
			await device.save();
		});

		it("should add the new device", async () => {
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
			expect(devices.length).to.equal(2);
			const device = devices[1];
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
