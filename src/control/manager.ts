import mongoose from "mongoose";
import { DBObject } from "src/db/schemas/base";
import Controller from "./controller";
import { DBObjField, Doc, DocInit, ID } from "./types";

abstract class Manager<D extends DBObject, C extends Controller<D>> {
	protected readonly Model: mongoose.Model<D>;

	constructor(model: mongoose.Model<D>) {
		this.Model = model;
	}

	async findID(
		id: mongoose.Types.ObjectId | string,
		defined?: readonly DBObjField<D>[]
	): Promise<C | null> {
		const doc = await this.Model.findById(id, defined?.join(" ")).exec();
		if (!doc) return null;
		return this.createController(doc, defined);
	}

	async create(data: DocInit<D>): Promise<C> {
		const doc = new this.Model(data);
		await doc.save();
		return this.createController(doc);
	}

	async createMany(dataArray: DocInit<D>[]): Promise<C[]> {
		return await Promise.all(dataArray.map((data) => this.create(data)));
	}

	async remove(id: ID): Promise<void> {
		const doc = await this.Model.findById(id).exec();
		if (doc) await doc.remove();
	}

	async idExists(id: ID): Promise<boolean> {
		const queryRes = await this.Model.exists({ _id: id }).exec();
		return !!queryRes;
	}

	protected abstract createController(
		document: Doc<D>,
		defined?: readonly DBObjField<D>[]
	): C;

	protected createControllers(
		documents: Doc<D>[],
		defined?: readonly DBObjField<D>[]
	): C[] {
		return documents.map((doc) => this.createController(doc, defined));
	}
}

export default Manager;
