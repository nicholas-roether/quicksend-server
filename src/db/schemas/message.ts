import mongoose from "mongoose";
import { DeviceModel } from "../models";

interface Message {
	from: mongoose.Types.ObjectId;
	to: mongoose.Types.ObjectId;
	sentAt: Date;
	readOnDevices: mongoose.Types.ObjectId[];
	headers: mongoose.Types.Map<string>;
	body: string;
}

const MessageSchema = new mongoose.Schema<Message>({
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
});

export default MessageSchema;
export type { Message };
