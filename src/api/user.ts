import Router from "@koa/router";
import Joi from "joi";
import db from "../db/database";

const user = new Router({ prefix: "/user" });

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

	if (await db.userExists(body.username))
		return ctx.throw("User already exists", 400);
	await db.createUser(body.username, body.password);
	if (body.display) await db.setDisplayName(body.username, body.display);
	ctx.status = 201;
	next();
});

export default user;
