import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "src/auth/handler";
import bodyValidator from "src/body_validator";
import { Accessor } from "src/control/controller";
import deviceManager from "src/control/device_manager";
import messageManager, { MessageToDevice } from "src/control/message_manager";
import { ID, ObjectId } from "src/control/types";
import userManager from "src/control/user_manager";
import { idToString, isValidID } from "src/control/utils";
import socketServer from "src/socket_server";
import { arrayDiff, mapObject, mapToRecord } from "src/utils";

const messages = new Router({ prefix: "/messages" });
messages.use(authHandler("Signature"));

messages.get("/targets/:userId", async (ctx, next) => {
	const userId = ctx.params.userId;
	if (!isValidID(userId)) return ctx.throw(400, "Invalid user id");

	if (!(await userManager.idExists(userId)))
		return ctx.throw(400, "User does not exist");
	const deviceCtrs = await deviceManager.findMessageTargets(
		userId,
		ctx.state.user.id,
		ctx.state.device
	);

	const targets: Record<string, string> = {};
	for (const deviceCtr of deviceCtrs)
		targets[deviceCtr.id.toHexString()] = deviceCtr.get("encryptionPublicKey");
	ctx.body = targets;

	return next();
});

interface SendMessageRequest {
	to: string;
	sentAt: string;
	headers: Record<string, string>;
	keys: Record<string, string>;
	iv: string;
	body: string;
}

const sendMessageSchema = Joi.object<SendMessageRequest>({
	to: Joi.string().required(),
	sentAt: Joi.string().isoDate().required(),
	headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
	keys: Joi.object().pattern(Joi.string(), Joi.string()).required(),
	iv: Joi.string().required(),
	body: Joi.string().required()
});

const MESSAGE_AGE_LIMIT = 300000; // 5 minutes

messages.post("/send", bodyValidator(sendMessageSchema), async (ctx, next) => {
	const userData = ctx.state.user as UserData;
	const { to, sentAt, headers, keys, iv, body } = ctx.request
		.body as SendMessageRequest;
	if (!isValidID(to)) return ctx.throw(400, "Invalid recipient user id");
	if (!(await userManager.idExists(to)))
		return ctx.throw(400, "User does not exist");

	const sentAtDate = new Date(sentAt);
	const messageAge = Date.now() - sentAtDate.getTime();
	if (messageAge < 0) {
		return ctx.throw(
			400,
			`Cannot send messages from the future (message age was ${messageAge})`
		);
	}
	if (messageAge > MESSAGE_AGE_LIMIT)
		return ctx.throw(400, `Message too old (message age was ${messageAge})`);

	const targets = await deviceManager.findMessageTargets(
		to,
		userData.id,
		ctx.state.device
	);
	const targetIds = targets.map((device) => device.id.toHexString());

	const idDiff = arrayDiff(Object.keys(keys), targetIds);
	if (idDiff.missing.length > 0)
		return ctx.throw(400, "Missing required target device(s)");
	if (idDiff.extra.length > 0)
		return ctx.throw(400, "Extraneous unknown device(s)");

	const messageCtr = await messageManager.create({
		fromUser: userData.id,
		toUser: to,
		sentAt: new Date(sentAt),
		headers,
		keys: mapObject(keys, (key) => Buffer.from(key, "base64")),
		iv: Buffer.from(iv, "base64"),
		body: Buffer.from(body, "base64")
	});

	socketServer.emitEvent(userData.id, "message", {
		from: userData.id.toHexString(),
		fromDevice: idToString(ctx.state.device)
	});
	socketServer.emitEvent(to, "message", { from: userData.id.toHexString() });

	ctx.status = 201;
	ctx.body = { id: messageCtr.id };
	return next();
});

messages.get("/poll", async (ctx, next) => {
	const deviceId = ctx.state.device as ID;
	const userId = ctx.state.user.id as ObjectId;
	const messageCtrs = await messageManager.poll(deviceId);

	ctx.body = messageCtrs.map((messageCtr: Accessor<MessageToDevice>) => {
		const incoming = userId.equals(messageCtr.get("toUser"));
		return {
			id: messageCtr.id.toHexString(),
			chat: incoming ? messageCtr.get("fromUser") : messageCtr.get("toUser"),
			incoming,
			sentAt: messageCtr.get("sentAt").toISOString(),
			headers: mapToRecord(messageCtr.get("headers")),
			key: messageCtr.get("key").toString("base64"),
			iv: messageCtr.get("iv").toString("base64"),
			body: messageCtr.get("body").toString("base64")
		};
	});

	return next();
});

messages.post("/clear", async (ctx, next) => {
	const deviceId = ctx.state.device as ID;
	await messageManager.clear(deviceId);
	return next();
});

export default messages;
