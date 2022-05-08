import { expect } from "chai";
import mongoose from "mongoose";
import deviceManager from "src/control/device_manager";
import DeviceModel from "src/db/models/device";
import { createMongooseConnection } from "../__utils__/mongoose";

describe("The device manager", () => {
	createMongooseConnection();

	describe("nameExistsForUser()", () => {
		it("should return false if no device with the provided name exists", async () => {
			const exists = await deviceManager.nameExistsForUser(
				"gdghfhgdfg",
				new mongoose.Types.ObjectId()
			);
			expect(exists).to.be.false;
		});

		it("should return false if the device belongs to a different user", async () => {
			const testDevice = new DeviceModel({
				name: "test_device",
				user: new mongoose.Types.ObjectId(),
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			await testDevice.save();

			const exists = await deviceManager.nameExistsForUser(
				"test_device",
				new mongoose.Types.ObjectId()
			);
			expect(exists).to.be.false;
		});

		it("should return true if the device belongs to the provided user", async () => {
			const userId = new mongoose.Types.ObjectId();
			const testDevice = new DeviceModel({
				name: "test_device",
				user: userId,
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			await testDevice.save();

			const exists = await deviceManager.nameExistsForUser(
				"test_device",
				userId
			);
			expect(exists).to.be.true;
		});

		it("should return true if a device with the name exists for the current user among others", async () => {
			const userId = new mongoose.Types.ObjectId();
			const testDevice = new DeviceModel({
				name: "test_device",
				user: userId,
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			const testDevice2 = new DeviceModel({
				name: "test_device",
				user: new mongoose.Types.ObjectId(),
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			await Promise.all([testDevice.save(), testDevice2.save()]);

			const exists = await deviceManager.nameExistsForUser(
				"test_device",
				userId
			);
			expect(exists).to.be.true;
		});
	});

	describe("list()", () => {
		it("should return an empty array if the user has no associated devices", async () => {
			const ctrs = await deviceManager.list(new mongoose.Types.ObjectId());
			expect(ctrs.length).to.equal(0);
		});

		it("should return all devices associated with the provided user", async () => {
			const userId = new mongoose.Types.ObjectId();
			const testDevice = new DeviceModel({
				name: "test_device",
				type: 2,
				user: userId,
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			const testDevice2 = new DeviceModel({
				name: "test_device",
				user: userId,
				signaturePublicKey: "657888796",
				encryptionPublicKey: "jhgghjklkjh"
			});
			await Promise.all([testDevice.save(), testDevice2.save()]);

			const ctrs = await deviceManager.list(userId);
			expect(ctrs.length).to.equal(2);
			const [ctr1, ctr2] = ctrs;

			expect(ctr1.id.equals(testDevice._id)).to.be.true;
			expect(ctr1.get("name")).to.equal(testDevice.name);
			expect(ctr1.get("type")).to.equal(testDevice.type);
			expect(ctr1.get("lastActivity").getTime()).to.equal(
				testDevice.lastActivity.getTime()
			);
			expect(ctr1.get("createdAt").getTime()).to.equal(
				testDevice.createdAt.getTime()
			);
			expect(ctr1.get("updatedAt").getTime()).to.equal(
				testDevice.updatedAt.getTime()
			);

			expect(ctr2.id.equals(testDevice2._id)).to.be.true;
			expect(ctr2.get("name")).to.equal(testDevice2.name);
			expect(ctr2.get("type")).to.equal(testDevice2.type);
			expect(ctr2.get("lastActivity").getTime()).to.equal(
				testDevice2.lastActivity.getTime()
			);
			expect(ctr2.get("createdAt").getTime()).to.equal(
				testDevice2.createdAt.getTime()
			);
			expect(ctr2.get("updatedAt").getTime()).to.equal(
				testDevice2.updatedAt.getTime()
			);
		});

		it("should list only the devices associated with the user", async () => {
			const userId = new mongoose.Types.ObjectId();
			const testDevice = new DeviceModel({
				name: "test_device",
				type: 2,
				user: userId,
				signaturePublicKey: "ffgsfdghfhgj",
				encryptionPublicKey: "ergtsdghfbfghj"
			});
			const otherDevice = new DeviceModel({
				name: "test_device",
				user: new mongoose.Types.ObjectId(),
				signaturePublicKey: "657888796",
				encryptionPublicKey: "jhgghjklkjh"
			});
			await Promise.all([testDevice.save(), otherDevice.save()]);

			const ctrs = await deviceManager.list(userId);
			expect(ctrs.length).to.equal(1);
			const ctr = ctrs[0];

			expect(ctr.id.equals(testDevice._id)).to.be.true;
			expect(ctr.get("name")).to.equal(testDevice.name);
			expect(ctr.get("type")).to.equal(testDevice.type);
			expect(ctr.get("lastActivity").getTime()).to.equal(
				testDevice.lastActivity.getTime()
			);
			expect(ctr.get("createdAt").getTime()).to.equal(
				testDevice.createdAt.getTime()
			);
			expect(ctr.get("updatedAt").getTime()).to.equal(
				testDevice.updatedAt.getTime()
			);
		});
	});

	describe("findMessageTargets()", () => {
		it("should return an empty array if no applicable devices exist", async () => {
			const ctrs = await deviceManager.findMessageTargets(
				new mongoose.Types.ObjectId(),
				new mongoose.Types.ObjectId(),
				new mongoose.Types.ObjectId()
			);
			expect(ctrs.length).to.equal(0);
		});

		it("should return devices associated with the target user", async () => {
			const targetUserId = new mongoose.Types.ObjectId();
			const otherDevice = new DeviceModel({
				name: "test_device",
				user: targetUserId,
				signaturePublicKey: "657888796",
				encryptionPublicKey: "jhgghjklkjh"
			});
			const otherDevice2 = new DeviceModel({
				name: "test_device_2",
				user: targetUserId,
				signaturePublicKey: "6578887965456",
				encryptionPublicKey: "jhgghjklggfhdkjh"
			});
			await Promise.all([otherDevice.save(), otherDevice2.save()]);

			const ctrs = await deviceManager.findMessageTargets(
				targetUserId,
				new mongoose.Types.ObjectId(),
				new mongoose.Types.ObjectId()
			);
			expect(ctrs.length).to.equal(2);
			const [ctr1, ctr2] = ctrs;
			expect(ctr1.id.equals(otherDevice._id)).to.be.true;
			expect(ctr1.get("encryptionPublicKey")).to.equal(
				otherDevice.encryptionPublicKey
			);
			expect(ctr2.id.equals(otherDevice2._id)).to.be.true;
			expect(ctr2.get("encryptionPublicKey")).to.equal(
				otherDevice2.encryptionPublicKey
			);
		});

		it("should return devices associated with the sender, apart from the one sending the message", async () => {
			const senderUserId = new mongoose.Types.ObjectId();
			const senderDevice = new DeviceModel({
				name: "sender_device",
				user: senderUserId,
				signaturePublicKey: "45676586879",
				encryptionPublicKey: "gfghdffghjgjhk"
			});
			const testDevice = new DeviceModel({
				name: "test_device",
				user: senderUserId,
				signaturePublicKey: "657888796",
				encryptionPublicKey: "jhgghjklkjh"
			});
			const testDevice2 = new DeviceModel({
				name: "test_device_2",
				user: senderUserId,
				signaturePublicKey: "6578887965456",
				encryptionPublicKey: "jhgghjklggfhdkjh"
			});
			await Promise.all([
				senderDevice.save(),
				testDevice.save(),
				testDevice2.save()
			]);

			const ctrs = await deviceManager.findMessageTargets(
				new mongoose.Types.ObjectId(),
				senderUserId,
				senderDevice._id
			);
			expect(ctrs.length).to.equal(2);
			const [ctr1, ctr2] = ctrs;
			expect(ctr1.id.equals(testDevice._id)).to.be.true;
			expect(ctr1.get("encryptionPublicKey")).to.equal(
				testDevice.encryptionPublicKey
			);
			expect(ctr2.id.equals(testDevice2._id)).to.be.true;
			expect(ctr2.get("encryptionPublicKey")).to.equal(
				testDevice2.encryptionPublicKey
			);
		});
	});

	it("should return all relevant devices from both the target and the sender user", async () => {
		const senderUserId = new mongoose.Types.ObjectId();
		const targetUserId = new mongoose.Types.ObjectId();
		const senderDevice = new DeviceModel({
			name: "sender_device",
			user: senderUserId,
			signaturePublicKey: "45676586879",
			encryptionPublicKey: "gfghdffghjgjhk"
		});
		const testDevice = new DeviceModel({
			name: "test_device",
			user: senderUserId,
			signaturePublicKey: "657888796",
			encryptionPublicKey: "jhgghjklkjh"
		});
		const someDevice = new DeviceModel({
			name: "test_device_2",
			user: targetUserId,
			signaturePublicKey: "6578887965456",
			encryptionPublicKey: "jhgghjklggfhdkjh"
		});
		await Promise.all([
			senderDevice.save(),
			testDevice.save(),
			someDevice.save()
		]);

		const ctrs = await deviceManager.findMessageTargets(
			targetUserId,
			senderUserId,
			senderDevice._id
		);
		expect(ctrs.length).to.equal(2);
		const [ctr1, ctr2] = ctrs;
		expect(ctr1.id.equals(testDevice._id)).to.be.true;
		expect(ctr1.get("encryptionPublicKey")).to.equal(
			testDevice.encryptionPublicKey
		);
		expect(ctr2.id.equals(someDevice._id)).to.be.true;
		expect(ctr2.get("encryptionPublicKey")).to.equal(
			someDevice.encryptionPublicKey
		);
	});
});
