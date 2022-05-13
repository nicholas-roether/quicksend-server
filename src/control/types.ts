import mongoose from "mongoose";
import { DBObject } from "src/db/schemas/base";

type Doc<T> = mongoose.Document<unknown, unknown, T> &
	T & { _id: mongoose.Types.ObjectId };

type ObjectId = mongoose.Types.ObjectId;
type ID = mongoose.Types.ObjectId | string;
type DocInit<D> = mongoose.AnyKeys<D>;
type DBObjField<D extends DBObject> = Exclude<keyof D & string, "_id">;

export type { Doc, ObjectId, ID, DocInit, DBObjField };
