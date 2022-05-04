import MessageModel from "src/db/models/message";
import { Message } from "src/db/schemas/message";
import Manager from "./manager";
import MessageController from "./message_controller";
import { Doc } from "./types";

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
}
const messageManager = new MessageManager();

export default messageManager;
