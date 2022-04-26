import Router from "@koa/router";
import Joi from "joi";
import bcrypt from "bcryptjs";
import UserModel from "../db/models/user";

const user = new Router({ prefix: "/user" });

const PASSWORD_SALT_LENGTH = 10;

interface CreateUserRequest {
	username: string;
	display?: string;
	password: string;
}

const schema = Joi.object<CreateUserRequest>({
	username: Joi.string()
		.pattern(/^[a-z0-9_-]+$/i)
		.min(3)
		.max(30)
		.required(),
	display: Joi.string().min(3).max(30),
	password: Joi.string().min(5).max(50)
});

user.post("/create", async (ctx, next) => {
	const { error, value: body } = schema.validate(ctx.request.body);
	if (error) return ctx.throw(error.message, 400);
	if (!body) return ctx.throw("Unexpected error", 500);

	if (await UserModel.exists({ username: body.username }).exec())
		return ctx.throw("User already exists", 400);
	const user = new UserModel({
		username: body.username,
		display: body.display,
		passwordHash: bcrypt.hashSync(body.password, PASSWORD_SALT_LENGTH)
	});
	await user.save();
	ctx.status = 201;
	ctx.body = { id: user._id.toHexString() };
	next();
});

export default user;
