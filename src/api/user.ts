import Router from "@koa/router";
import Joi from "joi";
import bodyValidator from "src/body_validator";
import authHandler, { UserData } from "src/auth/handler";
import userManager from "src/control/user_manager";
import { isValidID } from "src/control/utils";

const user = new Router({ prefix: "/user" });

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

	const userCtr = await userManager.createUser(
		body.username,
		body.password,
		body.display
	);

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

user.get("/info/:id", async (ctx, next) => {
	const id = ctx.params.id;
	if (!isValidID(id)) return ctx.throw(400, "Invalid user id");

	const userCtr = await userManager.findID(id, ["username", "display"]);
	if (!userCtr) {
		ctx.body = null;
		return next();
	}
	ctx.body = {
		id: userCtr.id.toHexString(),
		username: userCtr.get("username"),
		display: userCtr.get("display")
	};

	return next();
});

user.get("/find/:name", async (ctx, next) => {
	const username = ctx.params.name;

	const userCtr = await userManager.findUsername(username);
	if (!userCtr) {
		ctx.body = null;
		return next();
	}
	ctx.body = {
		id: userCtr.id,
		username: userCtr.get("username"),
		display: userCtr.get("display")
	};

	return next();
});

export default user;
