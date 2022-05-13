import { Message } from "src/db/schemas/message";
import Controller from "./controller";
import { DBObjField, Doc } from "./types";

class MessageController extends Controller<Message> {
	constructor(
		document: Doc<Message>,
		defined?: readonly DBObjField<Message>[]
	) {
		super(
			document,
			defined ?? ["body", "fromUser", "headers", "keys", "sentAt", "toUser"]
		);
	}
}

export default MessageController;
