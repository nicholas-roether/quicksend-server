import { DBObject } from "src/db/schemas/base";
import { Doc, ObjectId } from "./types";

class ProjectionAccessError extends Error {
	public readonly modelName: string;
	public readonly field: string;

	constructor(modelName: string, field: string) {
		super(
			`A ${modelName} controller tried to access the field '${field}', which was not defined in the projection provided at its creation.`
		);
		this.modelName = modelName;
		this.field = field;
	}
}

class Controller<D extends DBObject> {
	private readonly _doc: Doc<D>;
	private readonly definedFields: readonly string[] | null;

	constructor(document: Doc<D>, proj?: string) {
		this._doc = document;
		this.definedFields = proj ? proj.split(" ") : null;
	}

	get modelName(): string {
		return this._doc.modelName;
	}

	get id(): ObjectId {
		return this._doc._id;
	}

	get<F extends Exclude<keyof D & string, "_id">>(field: F): D[F] {
		if (!this.isFieldDefined(field))
			throw new ProjectionAccessError(this.modelName, field);
		const value = this._doc[field];
		return value;
	}

	async delete() {
		return await this._doc.delete();
	}

	private isFieldDefined(field: string) {
		if (!this.definedFields) return true;
		return this.definedFields.includes(field);
	}
}

export default Controller;
