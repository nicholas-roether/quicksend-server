import mongoose from "mongoose";

type Doc<T> = mongoose.Document<unknown, unknown, T> &
	T & { _id: mongoose.Types.ObjectId };

type ObjectId = mongoose.Types.ObjectId;
type ID = mongoose.Types.ObjectId | string;
type DocInit<D> = mongoose.AnyKeys<D>;

export type { Doc, ObjectId, ID, DocInit };
