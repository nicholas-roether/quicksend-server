import Router from "@koa/router";
import getRawBody from "raw-body";
import Joi from "joi";
import bodyValidator from "src/body_validator";
import authHandler, { UserData } from "src/auth/handler";
import userManager from "src/control/user_manager";
import { isValidID } from "src/control/utils";
import assetManager from "src/control/asset_manager";

const user = new Router({ prefix: "/user" });

const displayNameSchema = Joi.string().min(3).max(30);
const passwordSchema = Joi.string().min(5).max(50);

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
	display: displayNameSchema,
	password: passwordSchema.required()
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
		display: userData.display,
		profilePicture: userData.profilePicture?.toHexString(),
		status: userData.status
	};

	return next();
});

user.get("/info/:id", async (ctx, next) => {
	const id = ctx.params.id;
	if (!isValidID(id)) return ctx.throw(400, "Invalid user id");

	const userCtr = await userManager.findID(id, [
		"username",
		"display",
		"profilePicture",
		"status"
	]);
	if (!userCtr) {
		ctx.body = null;
		return next();
	}
	ctx.body = {
		id: userCtr.id.toHexString(),
		username: userCtr.get("username"),
		display: userCtr.get("display"),
		profilePicture: userCtr.get("profilePicture")?.toHexString(),
		status: userCtr.get("status")
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
		display: userCtr.get("display"),
		profilePicture: userCtr.get("profilePicture")?.toHexString(),
		status: userCtr.get("status")
	};

	return next();
});

interface UpdateUserRequest {
	display?: string;
	status?: string;
	password?: string;
}

const updateUserSchema = Joi.object<UpdateUserRequest>({
	display: displayNameSchema.optional(),
	password: passwordSchema.optional(),
	status: Joi.string().optional()
});

user.post(
	"/update",
	authHandler("Signature"),
	bodyValidator(updateUserSchema),
	async (ctx, next) => {
		const userData = ctx.state.user as UserData;
		const userCtr = await userManager.findID(userData.id);
		if (!userCtr) {
			return ctx.throw(
				400,
				"Cannot update the logged in user as they no longer exist"
			);
		}

		const body = ctx.request.body as UpdateUserRequest;

		if (body.display) userCtr.set("display", body.display);
		if (body.password) userCtr.setPassword(body.password);
		if (body.status) userCtr.set("status", body.status);
		await userCtr.update();

		return next();
	}
);

const PFP_ALLOWED_TYPES = ["image/png", "image/jpeg"];

user.post("/set-pfp", authHandler("Signature"), async (ctx, next) => {
	const body = await getRawBody(ctx.req);
	if (body.length == 0) ctx.throw(400, "Request body is empty");

	const userData = ctx.state.user as UserData;

	const userCtr = await userManager.findID(userData.id);
	if (!userCtr) {
		return ctx.throw(
			400,
			"Cannot update the logged in user as they no longer exist"
		);
	}

	const contentType = ctx.get("Content-Type");
	if (!PFP_ALLOWED_TYPES.includes(contentType)) {
		return ctx.throw(
			400,
			`Type ${contentType} is not supported as a profile picture`
		);
	}
	const assetCtr = await assetManager.create({
		mimeType: contentType,
		data: body
	});
	const oldPfp = userCtr.get("profilePicture");
	userCtr.set("profilePicture", assetCtr.id);
	await userCtr.update();
	if (oldPfp) await assetManager.deleteID(oldPfp);

	ctx.body = { id: assetCtr.id.toHexString() };
	return next();
});

export default user;
