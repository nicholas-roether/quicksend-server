import { DBObject } from "src/db/schemas/base";
import { Doc, ObjectId } from "./types";

class Controller<D extends DBObject> {
	private readonly _doc: Doc<D>;

	constructor(document: Doc<D>) {
		this._doc = document;
	}

	get modelName(): string {
		return this._doc.modelName;
	}

	get id(): ObjectId {
		return this._doc._id;
	}

	get<F extends Exclude<keyof D & string, "_id">>(field: F): D[F] {
		const value = this._doc[field];
		return value;
	}

	async delete() {
		return await this._doc.delete();
	}
}

export default Controller;
