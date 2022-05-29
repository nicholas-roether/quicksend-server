import { expect } from "chai";
import Sinon, { spy } from "sinon";
import DeviceModel from "src/db/models/device";
import UserModel from "src/db/models/user";
import { User } from "src/db/schemas/user";
import socketServer from "src/socket_server";
import supertest from "supertest";
import { createMongooseConnection } from "../__utils__/mongoose";
import { generateTestKeys } from "../__utils__/rsa";
import { createTestServer } from "../__utils__/server";
import { createSigner, Signer } from "../__utils__/signature";

const _socketServerGrantToken = socketServer.grantToken;

describe("GET /socket", () => {
	createMongooseConnection();

	let request: supertest.SuperTest<supertest.Test>;

	before(() => {
		request = supertest(createTestServer());
	});

	it("should not allow unauthenticated requests", async () => {
		await request.get("/socket").expect(401);
	});

	context("with Signature authorization", () => {
		const testKeypair = generateTestKeys();
		let testUser: User;
		let sign: Signer;

		beforeEach(async () => {
			const testUserDoc = new UserModel({
				username: "Test User",
				passwordHash: "dgfsdfghghjfjghf"
			});
			await testUserDoc.save();
			const testDevice = new DeviceModel({
				name: "Test Device",
				user: testUserDoc._id,
				signaturePublicKey: testKeypair.publicKey,
				encryptionPublicKey: "gffdghjtghfjgfhgjhf"
			});
			await testDevice.save();

			testUser = testUserDoc;
			sign = createSigner("get /socket", testDevice, testKeypair.privateKey);
			socketServer.grantToken = spy();
		});

		afterEach(async () => {
			socketServer.grantToken = _socketServerGrantToken;
		});

		it("should correctly grant a token to the logged in user", async () => {
			await sign(request.get("/socket")).expect(200);
			expect(
				(socketServer.grantToken as Sinon.SinonSpy).calledOnceWith(testUser._id)
			).to.be.true;
		});
	});
});
