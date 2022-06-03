import { User } from "src/db/schemas/user";
import Controller from "./controller";
import { DBObjField, Doc } from "./types";
import bcrypt from "bcryptjs";

class UserController extends Controller<User> {
	private static readonly PASSWORD_SALT_LENGTH = 10;

	constructor(document: Doc<User>, defined?: readonly DBObjField<User>[]) {
		super(
			document,
			defined ?? [
				"createdAt",
				"display",
				"passwordHash",
				"updatedAt",
				"username",
				"status",
				"profilePicture"
			]
		);
	}

	setPassword(password: string): void {
		this.set(
			"passwordHash",
			bcrypt.hashSync(password, UserController.PASSWORD_SALT_LENGTH)
		);
	}
}

export default UserController;
