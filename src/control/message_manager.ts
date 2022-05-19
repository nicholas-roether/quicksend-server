import mongoose from "mongoose";
import MessageModel from "src/db/models/message";
import { DBObject } from "src/db/schemas/base";
import { Message } from "src/db/schemas/message";
import { recordToMap } from "src/utils";
import { Accessor } from "./controller";
import Manager from "./manager";
import MessageController from "./message_controller";
import { Doc, ID } from "./types";
import { idToString } from "./utils";

interface MessageToDevice extends DBObject {
	fromUser: mongoose.Types.ObjectId;
	sentAt: Date;
	headers: Map<string, string>;
	key: string;
	body: string;
}

class MessageManager extends Manager<Message, MessageController> {
	constructor() {
		super(MessageModel);
	}

	protected createController(document: Doc<Message>): MessageController {
		return new MessageController(document);
	}

	async poll(deviceId: ID): Promise<Accessor<MessageToDevice>[]> {
		const idStr = idToString(deviceId);
		const deviceDocs = await this.Model.aggregate()
			.match({ [`keys.${idStr}`]: { $exists: true } })
			.project({
				fromUser: 1,
				sentAt: 1,
				headers: 1,
				key: `$keys.${idStr}`,
				body: 1
			})
			.exec();
		return deviceDocs.map(
			(doc) =>
				new Accessor<MessageToDevice>(
					{
						...doc,
						sentAt: new Date(doc.sentAt),
						headers: recordToMap(doc.headers as Record<string, string>)
					},
					["fromUser", "sentAt", "headers", "key", "body"]
				)
		);
	}

	async clear(deviceId: ID): Promise<void> {
		await this.Model.updateMany(
			{},
			{ $unset: { [`keys.${deviceId.toString()}`]: "" } }
		);
		await this.Model.deleteOne({ keys: {} });
	}
}
const messageManager = new MessageManager();

export default messageManager;

export type { MessageToDevice };
