import MessageModel from "src/db/models/message";
import { Message } from "src/db/schemas/message";
import Manager from "./manager";
import MessageController from "./message_controller";
import { Doc } from "./types";

class MessageManager extends Manager<Message, MessageController> {
	constructor() {
		super(MessageModel);
	}

	protected createController(document: Doc<Message>): MessageController {
		return new MessageController(document);
	}
}
const messageManager = new MessageManager();

export default messageManager;
