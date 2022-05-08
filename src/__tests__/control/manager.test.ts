import { assert, expect } from "chai";
import mongoose from "mongoose";
import Controller from "src/control/controller";
import Manager from "src/control/manager";
import { Doc } from "src/control/types";
import { DBObject } from "src/db/schemas/base";
import { createMongooseConnection } from "../__utils__/mongoose";

interface TestObj extends DBObject {
	val1: string;
	val2: number;
}

const TestObjSchema = new mongoose.Schema<TestObj>({
	val1: { type: String, required: true },
	val2: { type: Number, required: true }
});

const TestObjModel = mongoose.model("test_obj", TestObjSchema);

class TestObjManager extends Manager<TestObj, Controller<TestObj>> {
	constructor() {
		super(TestObjModel);
	}

	protected createController(
		document: Doc<TestObj>,
		proj?: string
	): Controller<TestObj> {
		return new Controller<TestObj>(document, proj);
	}
}

const testObjManager = new TestObjManager();

describe("The Manager class", () => {
	createMongooseConnection();

	describe("findID()", () => {
		it("Returns null if the provided ID does not exist", async () => {
			const ctr = await testObjManager.findID(new mongoose.Types.ObjectId());
			expect(ctr).to.be.null;
		});

		it("should return a controller for the document of the given ID if it exists", async () => {
			const testObj = new TestObjModel({
				val1: "sdfgfdhgjgfhj",
				val2: 42355647
			});
			await testObj.save();

			const ctr = await testObjManager.findID(testObj._id);
			assert(ctr != null);
			expect(ctr.id.equals(testObj._id)).to.be.true;
			expect(ctr.get("val1")).to.equal(testObj.val1);
			expect(ctr.get("val2")).to.equal(testObj.val2);
		});
	});

	describe("create()", () => {
		it("should create a single new document", async () => {
			await testObjManager.create({
				val1: "34545676578",
				val2: 56765787689
			});
			const testObjs = await TestObjModel.find().exec();
			expect(testObjs.length).to.equal(1);
			const testObj = testObjs[0];
			expect(testObj.val1).to.equal("34545676578");
			expect(testObj.val2).to.equal(56765787689);
		});
	});

	describe("createMany()", () => {
		it("should create multiple new documents", async () => {
			await testObjManager.createMany([
				{
					val1: "test1",
					val2: 1
				},
				{
					val1: "test2",
					val2: 2
				}
			]);
			const testObjs = await TestObjModel.find().exec();
			expect(testObjs.length).to.equal(2);
			const [testObj1, testObj2] = testObjs;
			expect(testObj1.val1).to.equal("test1");
			expect(testObj1.val2).to.equal(1);
			expect(testObj2.val1).to.equal("test2");
			expect(testObj2.val2).to.equal(2);
		});
	});

	describe("remove()", () => {
		it("should do nothing if the provided ID does not exist", async () => {
			await expect(() =>
				testObjManager.remove(new mongoose.Types.ObjectId())
			).not.to.throw();
		});

		it("should remove the element with the provided ID if it exists", async () => {
			const testDoc = new TestObjModel({
				val1: "grfdghhgj",
				val2: 43525
			});
			await testDoc.save();

			await testObjManager.remove(testDoc.id);
			const testDocs = await TestObjModel.find().exec();
			expect(testDocs.length).to.equal(0);
		});
	});

	describe("idExists()", () => {
		it("should return false if the ID does not exist", async () => {
			const exists = await testObjManager.idExists(
				new mongoose.Types.ObjectId()
			);
			expect(exists).to.be.false;
		});

		it("should return true if the id does exist", async () => {
			const testDoc = new TestObjModel({
				val1: "grfdghhgj",
				val2: 43525
			});
			await testDoc.save();

			const exists = await testObjManager.idExists(testDoc._id);
			expect(exists).to.be.true;
		});
	});
});
