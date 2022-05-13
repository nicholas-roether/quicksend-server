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
				keys: {
					[deviceId._id.toHexString()]: "gdfshjfggjhklhklj"
				},
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					[deviceId._id.toHexString()]: "gdfddfgjhjhgkjkl",
					[new mongoose.Types.ObjectId().toHexString()]: "sfgrdghfdjfhg"
				},
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
			expect(ctr1.get("key")).to.equal("gdfshjfggjhklhklj");
			expect(ctr1.get("headers").get("type")).to.equal(
				message1.headers.get("type")
			);
			expect(ctr1.get("body")).to.equal(message1.body);

			expect(ctr2.id.equals(message2._id)).to.be.true;
			expect(ctr2.get("fromUser").equals(message2.fromUser)).to.be.true;
			expect(ctr2.get("sentAt").getTime()).to.equal(message2.sentAt.getTime());
			expect(ctr2.get("key")).to.equal("gdfddfgjhjhgkjkl");
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
				keys: {
					[deviceId.toHexString()]: "dfsgghfjdjhfg"
				},
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Message 1"
			});
			const message2 = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					[new mongoose.Types.ObjectId().toHexString()]: "sdfggfhdhfjg"
				},
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
			expect(ctr.get("key")).to.equal("dfsgghfjdjhfg");
			expect(ctr.get("headers").get("type")).to.equal(
				message1.headers.get("type")
			);
			expect(ctr.get("body")).to.equal(message1.body);
		});
	});

	describe("clear()", () => {
		it("should remove the keys from all messages belonging to the device", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message1Doc = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				keys: {
					[deviceId.toHexString()]: "fsgdgfdhhjfg",
					gfdhfgjjhgjfgh: "sdgfrdfghhgfjdhjgf"
				},
				body: "Message 1"
			});
			const message2Doc = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				keys: {
					[deviceId.toHexString()]: "dsfggdhfsjhgf",
					gfdhfgjjhgjfgh: "gfdssfdg"
				},
				body: "Message 2"
			});
			await message1Doc.save();
			await message2Doc.save();

			await messageManager.clear(deviceId);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(2);
			const [message1, message2] = messages;

			expect(message1._id.equals(message1Doc._id)).to.be.true;
			expect(message1.keys).to.not.have.property(deviceId.toHexString());

			expect(message2._id.equals(message2Doc._id)).to.be.true;
			expect(message2.keys).to.not.have.property(deviceId.toHexString());
		});

		it("should delete devices with no keys left", async () => {
			const deviceId = new mongoose.Types.ObjectId();
			const message = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				keys: {
					[deviceId.toHexString()]: "fsgdgfdhhjfg"
				},
				body: "Message 1"
			});
			await message.save();

			await messageManager.clear(deviceId);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});
	});
});
