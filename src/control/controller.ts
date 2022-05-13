import { DBObject } from "src/db/schemas/base";
import { DBObjField, Doc, ObjectId } from "./types";

class ProjectionAccessError extends Error {
	public readonly field: string;

	constructor(field: string) {
		super(
			`An Accessor or Controller tried to access the field '${field}', which was not defined in the document it accessed.`
		);
		this.field = field;
	}
}

class Accessor<D extends DBObject> {
	private readonly obj: D;
	private readonly defined: readonly string[];

	constructor(obj: D, defined: readonly DBObjField<D>[]) {
		this.obj = obj;
		this.defined = defined;
	}

	get id(): ObjectId {
		return this.obj._id;
	}

	isDefined(field: string): field is DBObjField<D> {
		return this.defined.includes(field);
	}

	get<F extends DBObjField<D>>(field: F): D[F];
	get<F extends Exclude<string, DBObjField<D>>>(field: F): never;
	get(field: string): unknown;
	get(field: string): unknown {
		if (!this.isDefined(field)) throw new ProjectionAccessError(field);
		return this.obj[field];
	}
}

class Controller<D extends DBObject> extends Accessor<D> {
	private readonly doc: Doc<D>;

	constructor(document: Doc<D>, defined: readonly DBObjField<D>[]) {
		super(document, defined);
		this.doc = document;
	}

	get modelName(): string {
		return this.doc.collection.name.replace(/s$/, "");
	}

	get id(): ObjectId {
		return this.doc._id;
	}

	async set<F extends DBObjField<D>>(field: F, val: Doc<D>[F]): Promise<void> {
		this.doc[field] = val;
		await this.doc.save();
	}

	async delete() {
		return await this.doc.delete();
	}
}

export default Controller;
export { Accessor };
