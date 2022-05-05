import mongoose from "mongoose";
import DeviceModel from "src/db/models/device";
import UserModel from "../models/user";
import { DBObject } from "./base";

interface Message extends DBObject {
	fromUser: mongoose.Types.ObjectId;
	toUser: mongoose.Types.ObjectId;
	toDevice: mongoose.Types.ObjectId;
	sentAt: Date;
	headers: mongoose.Types.Map<string>;
	body: string;
}

const MessageSchema = new mongoose.Schema<Message>({
	fromUser: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
		ref: UserModel
	},
	toUser: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true
	},
	toDevice: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
		ref: DeviceModel
	},
	sentAt: { type: Date, required: true },
	headers: {
		type: mongoose.SchemaTypes.Map,
		of: String,
		default: new Map<string, string>()
	},
	body: { type: String, required: true }
});

export default MessageSchema;
export type { Message };
