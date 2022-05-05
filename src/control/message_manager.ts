import MessageModel from "src/db/models/message";
import { Message } from "src/db/schemas/message";
import Manager from "./manager";
import MessageController from "./message_controller";
import { Doc, ID } from "./types";

class MessageManager extends Manager<Message, MessageController> {
	constructor() {
		super(MessageModel);
	}

	protected createController(
		document: Doc<Message>,
		proj?: string
	): MessageController {
		return new MessageController(document, proj);
	}

	async poll(deviceId: ID): Promise<MessageController[]> {
		const deviceDocs = await this.Model.find({ toDevice: deviceId })
			.select("fromUser sentAt headers body")
			.exec();
		return this.createControllers(deviceDocs);
	}

	async clear(deviceId: ID): Promise<void> {
		await this.Model.deleteMany({ toDevice: deviceId });
	}
}
const messageManager = new MessageManager();

export default messageManager;
