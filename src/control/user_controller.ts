import { User } from "src/db/schemas/user";
import Controller from "./controller";
import { Doc } from "./types";

class UserController extends Controller<User> {
	constructor(document: Doc<User>, proj?: string) {
		super(document, proj);
	}
}

export default UserController;
