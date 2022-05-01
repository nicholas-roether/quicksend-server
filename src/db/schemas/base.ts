import mongoose from "mongoose";

interface DBObject {
	_id: mongoose.Types.ObjectId;
}

interface TimestampedDBObject extends DBObject {
	createdAt: Date;
	updatedAt: Date;
}

export type { DBObject, TimestampedDBObject };
