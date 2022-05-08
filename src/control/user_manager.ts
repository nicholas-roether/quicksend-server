import bcrypt from "bcryptjs";
import UserModel from "src/db/models/user";
import { User } from "src/db/schemas/user";
import Manager from "./manager";
import { Doc } from "./types";
import UserController from "./user_controller";

class UserManager extends Manager<User, UserController> {
	private static readonly PASSWORD_SALT_LENGTH = 10;

	constructor() {
		super(UserModel);
	}

	async usernameExists(username: string): Promise<boolean> {
		const doc = await this.Model.exists({ username }).exec();
		return !!doc;
	}

	async findUsername(username: string): Promise<UserController | null> {
		const doc = await this.Model.findOne({ username }).exec();
		if (!doc) return null;
		return this.createController(doc);
	}

	async createUser(
		username: string,
		password: string,
		display?: string
	): Promise<UserController> {
		return await this.create({
			username,
			display,
			passwordHash: bcrypt.hashSync(password, UserManager.PASSWORD_SALT_LENGTH)
		});
	}

	protected createController(
		document: Doc<User>,
		proj?: string
	): UserController {
		return new UserController(document, proj);
	}
}

const userManager = new UserManager();

export default userManager;
