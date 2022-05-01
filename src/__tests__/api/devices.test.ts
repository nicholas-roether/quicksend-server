import bcrypt from "bcryptjs";
import { expect } from "chai";
import mongoose from "mongoose";
import DeviceModel from "src/db/models/device";
import UserModel from "src/db/models/user";
import { Device } from "src/db/schemas/device";
import { User } from "src/db/schemas/user";
import supertest from "supertest";
import { createMongooseConnection } from "../__utils__/mongoose";
import { generateTestKeys } from "../__utils__/rsa";
import { createTestServer } from "../__utils__/server";
import { createTestSignatureGenerator } from "../__utils__/signature";

describe("POST /devices/add", () => {
	createMongooseConnection();

	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests and respond with 401", async () => {
		await request
			.post("/devices/add")
			.send({
				name: "test",
				signaturePublicKey: "sfaggfdhs",
				encryptionPublicKey: "sghdffdghjhfgdj"
			})
			.expect(401);

		const devices = await DeviceModel.find().exec();
		expect(devices.length).to.equal(0);
	});

	context("with Basic authorization", () => {
		const userData = {
			username: "test-user",
			password: "password123"
		};

		let user: User;

		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: userData.username,
				passwordHash: bcrypt.hashSync(userData.password, 10)
			});
			await testUserDoc.save();
			user = testUserDoc;
		});

		it("should require a value for name", async () => {
			await request
				.post("/devices/add")
				.send({
					signaturePublicKey: "sfaggfdhs",
					encryptionPublicKey: "sghdffdghjhfgdj"
				})
				.auth(userData.username, userData.password, { type: "basic" })
				.expect(400);
		});

		it("should require a value for signaturePublicKey", async () => {
			await request
				.post("/devices/add")
				.send({
					name: "sfaggfdhs",
					encryptionPublicKey: "sghdffdghjhfgdj"
				})
				.auth(userData.username, userData.password, { type: "basic" })
				.expect(400);
		});

		it("should require a value for encryptionPublicKey", async () => {
			await request
				.post("/devices/add")
				.send({
					name: "sdfdsgfh",
					signaturePublicKey: "sfaggfdhs"
				})
				.auth(userData.username, userData.password, { type: "basic" })
				.expect(400);
		});

		context("device with name does not exist", () => {
			it("should add device with name and public keys", async () => {
				const res = await request
					.post("/devices/add")
					.send({
						name: "Test Device",
						signaturePublicKey: "sfdghhgjkkzlg",
						encryptionPublicKey: "sdfghhjjghfk"
					})
					.auth(userData.username, userData.password, { type: "basic" })
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
					.post("/devices/add")
					.send({
						name: "Test Device",
						type: 2,
						signaturePublicKey: "sfdghhgjkkzlg",
						encryptionPublicKey: "sdfghhjjghfk"
					})
					.auth(userData.username, userData.password, { type: "basic" })
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
					user: user._id,
					signaturePublicKey: "restghjgdf",
					encryptionPublicKey: "tshghjghjf"
				});
				await device.save();
			});
			it("should return a 400 response and not add a device", async () => {
				await request
					.post("/devices/add")
					.send({
						name: "Test Device",
						signaturePublicKey: "sfdghhgjkkzlg",
						encryptionPublicKey: "sdfghhjjghfk"
					})
					.auth(userData.username, userData.password, { type: "basic" })
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
					.post("/devices/add")
					.send({
						name: "Test Device",
						signaturePublicKey: "sfdghhgjkkzlg",
						encryptionPublicKey: "sdfghhjjghfk"
					})
					.auth(userData.username, userData.password, { type: "basic" })
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
});

describe("POST /devices/remove", function () {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests and respond with 401", async () => {
		const deviceDoc = new DeviceModel({
			name: "test",
			user: new mongoose.Types.ObjectId(),
			signaturePublicKey: "sfaggfdhs",
			encryptionPublicKey: "sghdffdghjhfgdj"
		});
		await deviceDoc.save();
		await request
			.post("/devices/remove")
			.send({ id: deviceDoc._id.toHexString() })
			.expect(401);
		const devices = await DeviceModel.find().exec();
		expect(devices.length).to.equal(1);
	});

	context("with Signature authorization", () => {
		const genSignature = createTestSignatureGenerator("post /devices/remove");

		const deviceKeyPair = generateTestKeys();
		let user: User;
		let device: Device;

		beforeEach(async () => {
			const userDoc = new UserModel({
				username: "test_user",
				passwordHash: "gdhfsghfhjtkuf"
			});
			await userDoc.save();
			const deviceDoc = new DeviceModel({
				name: "test_device",
				user: userDoc._id,
				signaturePublicKey: deviceKeyPair.publicKey,
				encryptionPublicKey: "dsfhgdjgjk"
			});
			await deviceDoc.save();
			user = userDoc;
			device = deviceDoc;
		});

		it("should respond with 400 to requests that don't provide an id", async () => {
			const date = new Date();
			await request
				.post("/devices/remove")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(deviceKeyPair.privateKey, date, device)
				)
				.send({})
				.expect(400);
		});

		it("should be able to remove devices belonging to the authorized user", async () => {
			const device2 = new DeviceModel({
				name: "test_device_2",
				user: user._id,
				signaturePublicKey: "tzhtfzjljuöljh",
				encryptionPublicKey: "ghfdhfgjhgkjl"
			});
			await device2.save();

			const date = new Date();
			await request
				.post("/devices/remove")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(deviceKeyPair.privateKey, date, device)
				)
				.send({ id: device2._id })
				.expect(200);

			const val = await DeviceModel.exists({ _id: device2._id });
			const stillExists = !!val;
			expect(stillExists).to.be.false;
		});

		it("should be able to remove the current device itself", async () => {
			const date = new Date();
			await request
				.post("/devices/remove")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(deviceKeyPair.privateKey, date, device)
				)
				.send({ id: device._id })
				.expect(200);

			const stillExists = !!(await DeviceModel.exists({ id: device._id }));
			expect(stillExists).to.be.false;
		});

		it("should respond with 400 for non-existent device ids", async () => {
			const date = new Date();
			await request
				.post("/devices/remove")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(deviceKeyPair.privateKey, date, device)
				)
				.send({ id: new mongoose.Types.ObjectId() })
				.expect(400);
		});

		it("should not remove devices that do not belong to the authorized user", async () => {
			const unownedDevice = new DeviceModel({
				name: "Not Yours!",
				user: new mongoose.Types.ObjectId(),
				signaturePublicKey: "dsfghdfhjgfjtdgzhk",
				encryptionPublicKey: "sgdghdkjfdfjhfjdg"
			});
			await unownedDevice.save();

			const date = new Date();
			await request
				.post("/devices/remove")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(deviceKeyPair.privateKey, date, device)
				)
				.send({ id: unownedDevice._id })
				.expect(400);

			const stillExists = !!(await DeviceModel.exists({
				id: unownedDevice._id
			}));
			expect(stillExists).to.be.true;
		});
	});
});

describe("GET /devices/list", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests", async () => {
		const res = await request.get("/devices/list").expect(401);
		expect(res).to.not.have.property("data");
	});

	context("with Signature authorization", async () => {
		let testUser: User;
		let testDevice: Device;
		const testKeypair = generateTestKeys();
		const genSignature = createTestSignatureGenerator("get /devices/list");

		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "test-test-test",
				passwordHash: "seregfzdtfdghjtzfdkgh"
			});
			await testUserDoc.save();
			testUser = testUserDoc;

			const testDeviceDoc = new DeviceModel({
				name: "Test Device",
				user: testUser._id,
				type: 1,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "ergfdjhgfgkj"
			});
			await testDeviceDoc.save();
			testDevice = testDeviceDoc;
		});

		it("should return the current device if it is the only one", async () => {
			const date = new Date();
			const res = await request
				.get("/devices/list")
				.set("Date", date.toUTCString())
				.set(
					"Authorization",
					genSignature(testKeypair.privateKey, date, testDevice)
				)
				.expect(200);

			expect(res.body).to.deep.equal({
				data: [
					{
						id: testDevice._id.toHexString(),
						name: testDevice.name,
						type: testDevice.type,
						lastActivity: testDevice.lastActivity.toISOString(),
						createdAt: testDevice.createdAt.toISOString(),
						updatedAt: testDevice.updatedAt.toISOString()
					}
				]
			});
		});
	});
});
