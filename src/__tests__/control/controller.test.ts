import { expect } from "chai";
import mongoose from "mongoose";
import Controller from "src/control/controller";
import { Doc } from "src/control/types";
import { DBObject } from "src/db/schemas/base";
import { createMongooseConnection } from "../__utils__/mongoose";

interface TestObj extends DBObject {
	val1: string;
	val2: number;
	val3: boolean;
}

const TestObjSchema = new mongoose.Schema<TestObj>({
	val1: { type: String, required: true },
	val2: { type: Number, required: true },
	val3: { type: Boolean, required: true }
});

const TestObjModel = mongoose.model("test_obj", TestObjSchema);

class TestObjController extends Controller<TestObj> {}

describe("The Controller class", async () => {
	createMongooseConnection();
	let doc: Doc<TestObj>;
	let ctr: TestObjController;
	beforeEach(async () => {
		doc = new TestObjModel({
			val1: "test",
			val2: 69,
			val3: false
		});
		await doc.save();
		ctr = new TestObjController(doc);
	});

	it("should have the correct modelName value", () => {
		expect(ctr.modelName).to.equal("test_obj");
	});

	it("should have the correct ID", () => {
		expect(ctr.id.equals(doc._id)).to.be.true;
	});

	describe("get()", () => {
		it("should return the correct values for all fields", () => {
			expect(ctr.get("val1")).to.equal("test");
			expect(ctr.get("val2")).to.equal(69);
			expect(ctr.get("val3")).to.be.false;
		});

		it("should return undefined for unknown field names", () => {
			expect(ctr.get("fgdfghfh")).to.be.undefined;
		});

		it("should return undefined when attempting to get the '_id' field", () => {
			expect(ctr.get("_id")).to.be.undefined;
		});

		it("should throw an error when attempting to access a field outside the current projection", () => {
			const ctr2 = new TestObjController(doc, "val1 val3");
			expect(() => ctr2.get("val2")).to.throw();
		});
	});

	describe("delete()", () => {
		it("should delete the associated document", async () => {
			await ctr.delete();

			const testObjs = await TestObjModel.find().exec();
			expect(testObjs.length).to.equal(0);
		});
	});
});
