import Router from "@koa/router";
import Joi from "joi";
import bcrypt from "bcryptjs";
import bodyValidator from "src/body_validator";
import authHandler, { UserData } from "src/auth/handler";
import userManager from "src/control/user_manager";

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
	password: Joi.string().min(5).max(50).required()
});

user.post("/create", bodyValidator(createUserSchema), async (ctx, next) => {
	const body = ctx.request.body as CreateUserRequest;

	if (await userManager.usernameExists(body.username))
		return ctx.throw(400, "User already exists");

	const userCtr = await userManager.create({
		username: body.username,
		display: body.display,
		passwordHash: bcrypt.hashSync(body.password, PASSWORD_SALT_LENGTH)
	});

	ctx.status = 201;
	ctx.body = { id: userCtr.id.toHexString() };
	return next();
});

user.get("/info", authHandler("Signature"), async (ctx, next) => {
	const userData = ctx.state.user as UserData;

	ctx.body = {
		id: userData.id.toHexString(),
		username: userData.username,
		display: userData.display
	};

	return next();
});

export default user;
