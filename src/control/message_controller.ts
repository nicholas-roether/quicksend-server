import { Message } from "src/db/schemas/message";
import Controller from "./controller";
import { Doc } from "./types";

class MessageController extends Controller<Message> {
	constructor(document: Doc<Message>, proj?: string) {
		super(document, proj);
	}
}

export default MessageController;
