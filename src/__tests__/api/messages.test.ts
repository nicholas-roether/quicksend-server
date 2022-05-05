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
import { createSigner, Signer } from "../__utils__/signature";

describe("GET /messages/targets", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;
	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests and respond with 401", async () => {
		const res = await request.get("/messages/targets/strzhdrtdrj").expect(401);
		expect(res).to.not.have.property("data");
	});

	context("with Signature authorization", () => {
		let testUser: User;
		let testDevice: Device;
		const testKeypair = generateTestKeys();
		let sign: Signer;

		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "user123456",
				passwordHash: "rteztzjufgthj"
			});
			await testUserDoc.save();
			testUser = testUserDoc;
			const testDeviceDoc = new DeviceModel({
				name: "Test Device 456",
				user: testUser._id,
				type: 1,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "saddgfzhgfjhk"
			});
			await testDeviceDoc.save();
			testDevice = testDeviceDoc;
			sign = createSigner(
				"get /messages/targets/",
				testDevice,
				testKeypair.privateKey
			);
		});

		it("should respond with 400 to requests that provide an invalid id", async () => {
			await sign(
				request.get("/messages/targets/rthftghjdf"),
				"rthftghjdf"
			).expect(400);
		});

		it("should list all keys for the current user if their id is provided", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device 7654",
				user: testUser._id,
				type: 1,
				signaturePublicKey: "dtzhgfhjkhgjkl",
				encryptionPublicKey: "64357"
			});
			await testDevice2.save();

			const res = await sign(
				request.get(`/messages/targets/${testUser._id.toHexString()}`),
				testUser._id.toHexString()
			).expect(200);

			expect(res.body).to.deep.equal({
				data: [testDevice.encryptionPublicKey, testDevice2.encryptionPublicKey]
			});
		});

		it("should not list keys unrelated to the provided user id", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device 7654",
				user: new mongoose.Types.ObjectId(),
				type: 1,
				signaturePublicKey: "dtzhgfhjkhgjkl",
				encryptionPublicKey: "64357"
			});
			await testDevice2.save();

			const res = await sign(
				request.get(`/messages/targets/${testUser._id.toHexString()}`),
				testUser._id.toHexString()
			).expect(200);

			expect(res.body).to.deep.equal({
				data: [testDevice.encryptionPublicKey]
			});
		});

		it("should list keys for users other than the current one", async () => {
			const otherUser = new UserModel({
				username: "someOtherUser",
				passwordHash: "gfhjjgkfhkgjlh"
			});
			await otherUser.save();

			const someDevice = new DeviceModel({
				name: "Test Device 54676578",
				user: otherUser._id.toHexString(),
				type: 1,
				signaturePublicKey: "dfghhdfrghfgdh",
				encryptionPublicKey: "fghdhfgdhfdg"
			});
			const someOtherDevice = new DeviceModel({
				name: "Test Device 576867",
				user: otherUser._id.toHexString(),
				type: 2,
				signaturePublicKey: "ghfdghfghj",
				encryptionPublicKey: "fdsgfdhghfj"
			});
			await Promise.all([someDevice.save(), someOtherDevice.save()]);

			const res = await sign(
				request.get(`/messages/targets/${otherUser._id.toHexString()}`),
				otherUser._id.toHexString()
			).expect(200);

			expect(res.body).to.deep.equal({
				data: [
					someDevice.encryptionPublicKey,
					someOtherDevice.encryptionPublicKey
				]
			});
		});
	});
});
