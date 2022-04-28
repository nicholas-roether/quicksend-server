import Router from "@koa/router";
import Joi from "joi";
import bcrypt from "bcryptjs";
import bodyValidator from "quicksend-server/body_validator";
import UserModel from "quicksend-server/db/models/user";

const user = new Router({ prefix: "/user" });

const PASSWORD_SALT_LENGTH = 10;

interface CreateUserRequest {
	username: string;
	display?: string;
	password: string;
}

const createUserSchema = Joi.object<CreateUserRequest>({
	username: Joi.string()
		.pattern(/^[a-z0-9_-]+$/i)
		.min(3)
		.max(30)
		.required(),
	display: Joi.string().min(3).max(30),
	password: Joi.string().min(5).max(50)
});

user.post("/create", bodyValidator(createUserSchema), async (ctx, next) => {
	const body = ctx.request.body as CreateUserRequest;

	if (await UserModel.exists({ username: body.username }).exec())
		return ctx.throw(400, "User already exists");
	const user = new UserModel({
		username: body.username,
		display: body.display,
		passwordHash: bcrypt.hashSync(body.password, PASSWORD_SALT_LENGTH)
	});
	await user.save();
	ctx.status = 201;
	ctx.body = { id: user._id.toHexString() };
	return next();
});

export default user;
