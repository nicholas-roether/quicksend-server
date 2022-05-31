import { expect } from "chai";
import mongoose from "mongoose";
import DeviceModel from "src/db/models/device";
import MessageModel from "src/db/models/message";
import UserModel from "src/db/models/user";
import { Device } from "src/db/schemas/device";
import { User } from "src/db/schemas/user";
import { encodeBase64 } from "src/utils";
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

		context("When providing your own user id", () => {
			it("should return an empty list if only the current device is registered", async () => {
				const res = await sign(
					request.get(`/messages/targets/${testUser._id.toHexString()}`),
					testUser._id.toHexString()
				).expect(200);

				expect(res.body).to.deep.equal({
					data: {}
				});
			});

			it("should return the keys of all devices except the current one when multiple devices are registered", async () => {
				const testDevice2 = new DeviceModel({
					name: "Test Device 7654",
					user: testUser._id,
					type: 1,
					signaturePublicKey: "dtzhgfhjkhgjkl",
					encryptionPublicKey: "64357"
				});

				const testDevice3 = new DeviceModel({
					name: "Test Device 34545645",
					user: testUser._id,
					type: 1,
					signaturePublicKey: "dgfhfgh",
					encryptionPublicKey: "fhgdjghfkjghjfk"
				});
				await Promise.all([testDevice2.save(), testDevice3.save()]);

				const res = await sign(
					request.get(`/messages/targets/${testUser._id.toHexString()}`),
					testUser._id.toHexString()
				).expect(200);

				expect(res.body).to.deep.equal({
					// data: [
					// 	testDevice2.encryptionPublicKey,
					// 	testDevice3.encryptionPublicKey
					// ]
					data: {
						[testDevice2._id.toHexString()]: testDevice2.encryptionPublicKey,
						[testDevice3._id.toHexString()]: testDevice3.encryptionPublicKey
					}
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
					data: {}
				});
			});
		});

		context("when providing a different user id", () => {
			it("should list only the keys for all devices of the target user if the user sending the message has only one registered device", async () => {
				const otherUser = new UserModel({
					username: "someOtherUser",
					passwordHash: "gfhjjgkfhkgjlh"
				});
				await otherUser.save();

				const someDevice = new DeviceModel({
					name: "Test Device 54676578",
					user: otherUser._id,
					type: 1,
					signaturePublicKey: "dfghhdfrghfgdh",
					encryptionPublicKey: "fghdhfgdhfdg"
				});
				const someOtherDevice = new DeviceModel({
					name: "Test Device 576867",
					user: otherUser._id,
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
					data: {
						[someDevice._id.toHexString()]: someDevice.encryptionPublicKey,
						[someOtherDevice._id.toHexString()]:
							someOtherDevice.encryptionPublicKey
					}
				});
			});

			it("should include keys from devices of the current user apart from the one used to send the message when sending messages to other users", async () => {
				const testDevice2 = new DeviceModel({
					name: "Test Device 5345467",
					user: testUser._id,
					type: 2,
					signaturePublicKey: "ffdgsdfghhgjf",
					encryptionPublicKey: "sfgfdghhgfj"
				});
				await testDevice2.save();

				const otherUser = new UserModel({
					username: "someOtherUser",
					passwordHash: "gfhjjgkfhkgjlh"
				});
				await otherUser.save();

				const someDevice = new DeviceModel({
					name: "Test Device 54676578",
					user: otherUser._id,
					type: 1,
					signaturePublicKey: "dfghhdfrghfgdh",
					encryptionPublicKey: "fghdhfgdhfdg"
				});
				const someOtherDevice = new DeviceModel({
					name: "Test Device 576867",
					user: otherUser._id,
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
					data: {
						[testDevice2._id.toHexString()]: testDevice2.encryptionPublicKey,
						[someDevice._id.toHexString()]: someDevice.encryptionPublicKey,
						[someOtherDevice._id.toHexString()]:
							someOtherDevice.encryptionPublicKey
					}
				});
			});
		});
	});
});

describe("POST /messages/send", async () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;
	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests and respond with 401", async () => {
		const res = await request.post("/messages/send").expect(401);
		expect(res).to.not.have.property("data");
	});

	context("with Signature authorization", async () => {
		const testKeypair = generateTestKeys();
		let testUser: User;
		let testDevice: Device;
		let sign: Signer;
		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "some_user_234456",
				passwordHash: "dgfshgrfdhhjfgd"
			});
			await testUserDoc.save();
			const testDeviceDoc = new DeviceModel({
				name: "Test Device #546379786",
				user: testUserDoc._id,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "sfgrfghjghjk"
			});
			await testDeviceDoc.save();
			testUser = testUserDoc;
			testDevice = testDeviceDoc;

			sign = createSigner(
				"post /messages/send",
				testDevice,
				testKeypair.privateKey
			);
		});

		it("should respond with 400 when attempting to send a message from a device to itself", async () => {
			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests missing the target user id", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();
			await sign(request.post("/messages/send"))
				.send({
					sentAt: new Date().toISOString(),
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice2._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests with an invalid target user id", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();
			await sign(request.post("/messages/send"))
				.send({
					to: "dgsfhhfgjhgjkjkhl",
					sentAt: new Date().toISOString(),
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice2._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests with a non-existent target user id", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();
			await sign(request.post("/messages/send"))
				.send({
					to: new mongoose.Types.ObjectId(),
					sentAt: new Date().toISOString(),
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice2._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests missing the sentAt field", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice2._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests with a sentAt field that is not a valid ISO date", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: "dgzhf gjkkhlhjkljh",
					headers: {
						type: "text/plain"
					},
					bodies: {
						[testDevice2._id.toHexString()]: "Hello World"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should allow and handle requests that don't specify headers", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: date.toISOString(),
					keys: {
						[testDevice2._id.toHexString()]: encodeBase64("75668798retujh")
					},
					iv: encodeBase64("dfgsgfdhfhgj"),
					body: encodeBase64("Hello World")
				})
				.expect(201);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(1);
			const message = messages[0];
			expect(message.fromUser.equals(testUser._id)).to.be.true;
			expect(message.toUser.equals(testUser._id)).to.be.true;
			expect(
				message.keys.get(testDevice2._id.toHexString())?.toString()
			).to.equal("75668798retujh");
			expect(message.iv.toString()).to.equal("dfgsgfdhfhgj");
			expect(message.sentAt.getTime()).to.equal(date.getTime());
			expect(message.headers.size).to.equal(0);
			expect(message.body.toString()).to.equal("Hello World");
		});

		it("should respond with 400 to requests that don't specify a bodies field", async () => {
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: new Date().toISOString(),
					headers: {
						type: "text/plain"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should respond with 400 to requests that don't specify a bodies field", async () => {
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: new Date().toISOString(),
					headers: {
						type: "text/plain"
					}
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should save correctly formed messages to oneself to the database", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: testUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					keys: {
						[testDevice2._id.toHexString()]: encodeBase64("4356576788546")
					},
					iv: encodeBase64("sgfddfgsgfhd"),
					body: encodeBase64("Hello World")
				})
				.expect(201);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(1);
			const message = messages[0];
			expect(message.fromUser.equals(testUser._id)).to.be.true;
			expect(message.toUser.equals(testUser._id)).to.be.true;
			expect(
				message.keys.get(testDevice2._id.toHexString())?.toString()
			).to.equal("4356576788546");
			expect(message.iv.toString()).to.equal("sgfddfgsgfhd");
			expect(message.sentAt.getTime()).to.equal(date.getTime());
			expect(message.headers.size).to.equal(1);
			expect(message.headers.get("type")).to.equal("text/plain");
			expect(message.body.toString()).to.equal("Hello World");
		});

		it("should save correctly formed messages to others to the database", async () => {
			const otherUser = new UserModel({
				username: "someOtherUser",
				passwordHash: "sfgfghjjhgtfghjf"
			});
			await otherUser.save();
			const someDevice = new DeviceModel({
				name: "Some Device #45665657",
				user: otherUser._id,
				signaturePublicKey: "fsggfdjhghfjk",
				encryptionPublicKey: "dfgshhfgdjghjf"
			});
			await someDevice.save();

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: otherUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					keys: {
						[someDevice._id.toHexString()]: encodeBase64("Hgffjhkhlj")
					},
					iv: encodeBase64("sgfddfgsgfhd"),
					body: encodeBase64("Hello World")
				})
				.expect(201);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(1);
			const message = messages[0];
			expect(message.fromUser.equals(testUser._id)).to.be.true;
			expect(message.toUser.equals(otherUser._id)).to.be.true;
			expect(
				message.keys.get(someDevice._id.toHexString())?.toString()
			).to.equal("Hgffjhkhlj");
			expect(message.iv.toString()).to.equal("sgfddfgsgfhd");
			expect(message.sentAt.getTime()).to.equal(date.getTime());
			expect(message.headers.size).to.equal(1);
			expect(message.headers.get("type")).to.equal("text/plain");
			expect(message.body.toString()).to.equal("Hello World");
		});

		it("should save correctly formed messages to others and other devices of the same user", async () => {
			const testDevice2 = new DeviceModel({
				name: "Test Device #4567678878",
				user: testUser._id,
				signaturePublicKey: "dfgsfhgdjghj",
				encryptionPublicKey: "sfgfgdhfghjgfhj"
			});
			await testDevice2.save();

			const otherUser = new UserModel({
				username: "someOtherUser",
				passwordHash: "sfgfghjjhgtfghjf"
			});
			await otherUser.save();
			const someDevice = new DeviceModel({
				name: "Some Device #45665657",
				user: otherUser._id,
				signaturePublicKey: "fsggfdjhghfjk",
				encryptionPublicKey: "dfgshhfgdjghjf"
			});
			await someDevice.save();

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: otherUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					keys: {
						[testDevice2._id.toHexString()]: encodeBase64("dfhjjkjhllök"),
						[someDevice._id.toHexString()]: encodeBase64("hjfdggkllökj")
					},
					iv: encodeBase64("dfggdfhfhghgfj"),
					body: encodeBase64("Hello! :)")
				})
				.expect(201);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(1);
			const message = messages[0];

			expect(message.fromUser.equals(testUser._id)).to.be.true;
			expect(message.toUser.equals(otherUser._id)).to.be.true;
			expect(
				message.keys.get(testDevice2._id.toHexString())?.toString()
			).to.equal("dfhjjkjhllök");
			expect(
				message.keys.get(someDevice._id.toHexString())?.toString()
			).to.equal("hjfdggkllökj");
			expect(message.iv.toString()).to.equal("dfggdfhfhghgfj");
			expect(message.sentAt.getTime()).to.equal(date.getTime());
			expect(message.headers.size).to.equal(1);
			expect(message.headers.get("type")).to.equal("text/plain");
			expect(message.body.toString()).to.equal("Hello! :)");
		});

		it("should return 400 for requests that are missing a device of the target user", async () => {
			const otherUser = new UserModel({
				username: "someOtherUser",
				passwordHash: "sfgfghjjhgtfghjf"
			});
			await otherUser.save();
			const someDevice = new DeviceModel({
				name: "Some Device #45665657",
				user: otherUser._id,
				signaturePublicKey: "fsggfdjhghfjk",
				encryptionPublicKey: "dfgshhfgdjghjf"
			});
			const someOtherDevice = new DeviceModel({
				name: "Some Device #54667867",
				user: otherUser._id,
				signaturePublicKey: "fgdfghgfhjk",
				encryptionPublicKey: "fdghfghjghfj"
			});
			await Promise.all([someDevice.save(), someOtherDevice.save()]);

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: otherUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					keys: {
						[someDevice._id.toHexString()]: "fghdjkghjkhg"
					},
					body: "dfsghhjgf"
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});

		it("should return 400 for requests that are missing a device of the current user", async () => {
			const otherUser = new UserModel({
				username: "someOtherUser",
				passwordHash: "sfgfghjjhgtfghjf"
			});
			await otherUser.save();
			const someDevice = new DeviceModel({
				name: "Some Device #45665657",
				user: otherUser._id,
				signaturePublicKey: "fsggfdjhghfjk",
				encryptionPublicKey: "dfgshhfgdjghjf"
			});
			const testDevice2 = new DeviceModel({
				name: "Some Device #6756789879",
				user: testUser._id,
				signaturePublicKey: "fgdfghgfhjk",
				encryptionPublicKey: "fdghfghjghfj"
			});
			await Promise.all([someDevice.save(), testDevice2.save()]);

			const date = new Date();
			await sign(request.post("/messages/send"))
				.send({
					to: otherUser._id.toHexString(),
					sentAt: date.toISOString(),
					headers: {
						type: "text/plain"
					},
					keys: {
						[someDevice._id.toHexString()]: "fghfgjhkklhjg"
					},
					body: "fgsdghfdjhfg"
				})
				.expect(400);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(0);
		});
	});
});

describe("GET /messages/poll", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;
	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests and respond with 401", async () => {
		const res = await request.get("/messages/poll").expect(401);
		expect(res).to.not.have.property("data");
	});

	context("with Signature authorization", async () => {
		const testKeypair = generateTestKeys();
		let testUser: User;
		let testDevice: Device;
		let sign: Signer;
		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "some_user_564657",
				passwordHash: "sfgghtfgjrtz"
			});
			await testUserDoc.save();
			const testDeviceDoc = new DeviceModel({
				name: "Test Device #87659800978",
				user: testUserDoc._id,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "gsdffhgjgjh"
			});
			await testDeviceDoc.save();
			testUser = testUserDoc;
			testDevice = testDeviceDoc;

			sign = createSigner(
				"get /messages/poll",
				testDevice,
				testKeypair.privateKey
			);
		});

		it("should return an empty array if there are no messages", async () => {
			const res = await sign(request.get("/messages/poll")).expect(200);
			expect(res.body).to.deep.equal({ data: [] });
		});

		it("should return all messages to the authenticated device", async () => {
			const sender = new mongoose.Types.ObjectId();
			const testMsg1 = new MessageModel({
				fromUser: sender,
				toUser: testUser._id,
				keys: {
					[testDevice._id.toHexString()]: "dfsfdgshdghf"
				},
				iv: "dgfhfhgjgfjhgjhfjgh",
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Hi there!"
			});
			const testMsg2 = new MessageModel({
				fromUser: testUser._id,
				toUser: sender,
				keys: {
					[testDevice._id.toHexString()]: "54656732"
				},
				iv: "fdsggdfhhfgjdfhjg",
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "This is an outgoing message"
			});
			await Promise.all([testMsg1.save(), testMsg2.save()]);

			const res = await sign(request.get("/messages/poll")).expect(200);
			expect(res.body).to.deep.equal({
				data: [
					{
						id: testMsg1._id.toHexString(),
						chat: sender.toHexString(),
						incoming: true,
						sentAt: testMsg1.sentAt.toISOString(),
						headers: {
							type: "text/plain"
						},
						key: encodeBase64("dfsfdgshdghf"),
						iv: encodeBase64("dgfhfhgjgfjhgjhfjgh"),
						body: encodeBase64("Hi there!")
					},
					{
						id: testMsg2._id.toHexString(),
						chat: sender.toHexString(),
						incoming: false,
						sentAt: testMsg2.sentAt.toISOString(),
						headers: {
							type: "text/plain"
						},
						key: encodeBase64("54656732"),
						iv: encodeBase64("fdsggdfhhfgjdfhjg"),
						body: encodeBase64("This is an outgoing message")
					}
				]
			});
		});

		it("should return only messages to the authenticated device", async () => {
			const sender = new mongoose.Types.ObjectId();
			const testMsg1 = new MessageModel({
				fromUser: sender,
				toUser: testUser._id,
				keys: {
					[testDevice._id.toHexString()]: "dfsg hfgjjgkhzf"
				},
				iv: "sfdggfdhhjgfjhftg",
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "Hi there!"
			});
			const testMsg2 = new MessageModel({
				fromUser: testUser._id,
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					[new mongoose.Types.ObjectId().toHexString()]: "sdfgfghd"
				},
				iv: "fsggfhdjfghhjkghk",
				sentAt: new Date(),
				headers: {
					type: "text/plain"
				},
				body: "This is private stuff!"
			});
			await Promise.all([testMsg1.save(), testMsg2.save()]);

			const res = await sign(request.get("/messages/poll")).expect(200);
			expect(res.body).to.deep.equal({
				data: [
					{
						id: testMsg1._id.toHexString(),
						chat: sender.toHexString(),
						incoming: true,
						sentAt: testMsg1.sentAt.toISOString(),
						headers: {
							type: "text/plain"
						},
						key: encodeBase64("dfsg hfgjjgkhzf"),
						iv: encodeBase64("sfdggfdhhjgfjhftg"),
						body: encodeBase64("Hi there!")
					}
				]
			});
		});
	});
});

describe("POST /messages/clear", () => {
	createMongooseConnection();
	let request: supertest.SuperTest<supertest.Test>;
	before(() => {
		request = supertest(createTestServer());
	});

	it("should not accept unauthorized requests", async () => {
		await request.post("/messages/clear").expect(401);
	});

	describe("with Signature authorization", () => {
		const testKeypair = generateTestKeys();
		let testDevice: Device;
		let sign: Signer;
		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "some_user_564657",
				passwordHash: "sfgghtfgjrtz"
			});
			await testUserDoc.save();
			const testDeviceDoc = new DeviceModel({
				name: "Test Device #87659800978",
				user: testUserDoc._id,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "gsdffhgjgjh"
			});
			await testDeviceDoc.save();
			testDevice = testDeviceDoc;

			sign = createSigner(
				"post /messages/clear",
				testDevice,
				testKeypair.privateKey
			);
		});

		it("should correctly delete keys", async () => {
			const message1Doc = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					[testDevice._id.toHexString()]: "gdfhgfhjgjfhk",
					fgdsfhgjgjfhkhjkg: "fgdhfjgjgkhfjkhg"
				},
				iv: "gfdsfhgjjghf",
				sentAt: new Date(),
				body: "Message 1"
			});
			const message2Doc = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					[testDevice._id.toHexString()]: "hthgdfjfhjghjgfj"
				},
				iv: "gfsghdffhg",
				sentAt: new Date(),
				body: "Message 1"
			});
			const message3Doc = new MessageModel({
				fromUser: new mongoose.Types.ObjectId(),
				toUser: new mongoose.Types.ObjectId(),
				keys: {
					hgfjhgfghjfjhgjghk: "dfsgrhfghjgf"
				},
				iv: "dfsggfhdfgh",
				sentAt: new Date(),
				body: "Message 1"
			});
			await Promise.all([message1Doc.save(), message2Doc.save()]);
			await message3Doc.save();

			await sign(request.post("/messages/clear")).expect(200);

			const messages = await MessageModel.find().exec();
			expect(messages.length).to.equal(2);
			const [message1, message3] = messages;
			expect(message1._id.equals(message1Doc._id)).to.be.true;
			expect(message1.keys.has(testDevice._id.toHexString())).to.be.false;
			expect(message1.keys.has("fgdsfhgjgjfhkhjkg")).to.be.true;
			expect(message3._id.equals(message3Doc._id)).to.be.true;
			expect(message3.keys.has("hgfjhgfghjfjhgjghk")).to.be.true;
		});
	});
});
