import mongoose from "mongoose";
import UserModel from "../models/user";
import { DBObject } from "./base";

interface Message extends DBObject {
	fromUser: mongoose.Types.ObjectId;
	toUser: mongoose.Types.ObjectId;
	keys: Map<string, mongoose.Types.Buffer>;
	iv: mongoose.Types.Buffer;
	sentAt: Date;
	headers: mongoose.Types.Map<string>;
	body: mongoose.Types.Buffer;
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
	keys: {
		type: mongoose.SchemaTypes.Map,
		of: mongoose.SchemaTypes.Buffer,
		required: true
	},
	iv: {
		type: mongoose.SchemaTypes.Buffer,
		required: true
	},
	sentAt: { type: Date, required: true },
	headers: {
		type: mongoose.SchemaTypes.Map,
		of: String,
		default: new Map<string, string>()
	},
	body: { type: mongoose.SchemaTypes.Buffer, required: true }
});

export default MessageSchema;
export type { Message };
