import mongoose from "mongoose";
import DeviceModel from "src/db/models/device";
import { TimestampedDBObject } from "./base";

interface Message extends TimestampedDBObject {
	from: mongoose.Types.ObjectId;
	to: mongoose.Types.ObjectId;
	sentAt: Date;
	readOnDevices: mongoose.Types.ObjectId[];
	headers: mongoose.Types.Map<string>;
	body: string;
}

const MessageSchema = new mongoose.Schema<Message>(
	{
		from: { type: mongoose.SchemaTypes.ObjectId, required: true },
		to: { type: mongoose.SchemaTypes.ObjectId, required: true },
		sentAt: { type: Date, required: true },
		readOnDevices: {
			type: mongoose.SchemaTypes.ObjectId,
			default: [],
			ref: DeviceModel
		},
		headers: {
			type: mongoose.SchemaTypes.Map,
			of: String,
			default: new Map<string, string>()
		},
		body: { type: String, required: true }
	},
	{ timestamps: true }
);

export default MessageSchema;
export type { Message };
