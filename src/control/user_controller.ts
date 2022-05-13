import { User } from "src/db/schemas/user";
import Controller from "./controller";
import { DBObjField, Doc } from "./types";

class UserController extends Controller<User> {
	constructor(document: Doc<User>, defined?: readonly DBObjField<User>[]) {
		super(
			document,
			defined ?? [
				"createdAt",
				"display",
				"passwordHash",
				"updatedAt",
				"username"
			]
		);
	}
}

export default UserController;
