import { expect } from "chai";
import mongoose from "mongoose";
import messageManager from "src/control/message_manager";
import MessageModel from "src/db/models/message";
import { createMongooseConnection } from "../__utils__/mongoose";

describe("The message manager", () => {
	createMongooseConnection();

	describe("poll()", () => {
		it("should return an empty array if no messages to the device exist", async () => {
			const ctrs = await messageManager.poll(new mongoose.Types.ObjectId());
			expect(ctrs.length).to.equal(0);
		});

		it("should return all messages associated with the device", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message1 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "application/json"
				},
				body: "{'number':2}"
			});
			await Promise.all([message1.save(), message2.save()]);

			const ctrs = await messageManager.poll(deviceId);
			expect(ctrs.length).to.equal(2);
			const [ctr1, ctr2] = ctrs;

			expect(ctr1.id.equals(message1._id)).to.be.true;
			expect(ctr1.get("fromUser").equals(message1.fromUser)).to.be.true;
			expect(ctr1.get("sentAt").getTime()).to.equal(message1.sentAt.getTime());
			expect(ctr1.get("headers").get("type")).to.equal(
				message1.headers.get("type")
			);
			expect(ctr1.get("body")).to.equal(message1.body);

			expect(ctr2.id.equals(message2._id)).to.be.true;
			expect(ctr2.get("fromUser").equals(message2.fromUser)).to.be.true;
			expect(ctr2.get("sentAt").getTime()).to.equal(message2.sentAt.getTime());
			expect(ctr2.get("headers").get("type")).to.equal(
				message2.headers.get("type")
			);
			expect(ctr2.get("body")).to.equal(message2.body);
		});

		it("should only return messages that belong to the specified device", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message1 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: new mongoose.Types.ObjectId(),
				sentAt: new Date(),
				headers: {
					type: "application/json"
				},
				body: "{'number':2}"
			});
			await Promise.all([message1.save(), message2.save()]);

			const ctrs = await messageManager.poll(deviceId);
			expect(ctrs.length).to.equal(1);
			const ctr = ctrs[0];

			expect(ctr.id.equals(message1._id)).to.be.true;
			expect(ctr.get("fromUser").equals(message1.fromUser)).to.be.true;
			expect(ctr.get("sentAt").getTime()).to.equal(message1.sentAt.getTime());
			expect(ctr.get("headers").get("type")).to.equal(
				message1.headers.get("type")
			);
			expect(ctr.get("body")).to.equal(message1.body);
		});
	});

	describe("clear()", () => {
		it("should delete all messages belonging to the device", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message1 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "application/json"
				},
				body: "{'number':2}"
			});
			await Promise.all([message1.save(), message2.save()]);

			await messageManager.clear(deviceId);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should only delete messages belonging to the device", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message1 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: deviceId,
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				toDevice: new mongoose.Types.ObjectId(),
				sentAt: new Date(),
				headers: {
					type: "application/json"
				},
				body: "{'number':2}"
			});
			await Promise.all([message1.save(), message2.save()]);

			await messageManager.clear(deviceId);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(1);
			const message = messages[0];
			expect(message._id.equals(message2._id)).to.be.true;
		});
	});
});
