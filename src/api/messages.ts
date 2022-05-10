import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "src/auth/handler";
import bodyValidator from "src/body_validator";
import deviceManager from "src/control/device_manager";
import MessageController from "src/control/message_controller";
import messageManager from "src/control/message_manager";
import { ID } from "src/control/types";
import userManager from "src/control/user_manager";
import { isValidID } from "src/control/utils";
import { arrayDiff, mapToRecord } from "src/utils";

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

	const ids: string[] = deviceCtrs.map((deviceCtr) =>
		deviceCtr.get("encryptionPublicKey")
	);
	ctx.body = ids;

	return next();
});

interface SendMessageRequest {
	to: string;
	sentAt: string;
	headers: Record<string, string>;
	bodies: Record<string, string>;
}

const sendMessageSchema = Joi.object<SendMessageRequest>({
	to: Joi.string().required(),
	sentAt: Joi.string().isoDate().required(),
	headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
	bodies: Joi.object().pattern(Joi.string(), Joi.string()).required()
});

const MESSAGE_AGE_LIMIT = 300000; // 5 minutes

messages.post("/send", bodyValidator(sendMessageSchema), async (ctx, next) => {
	const userData = ctx.state.user as UserData;
	const { to, sentAt, headers, bodies } = ctx.request
		.body as SendMessageRequest;
	if (!isValidID(to)) return ctx.throw(400, "Invalid recipient user id");
	if (!(await userManager.idExists(to)))
		return ctx.throw(400, "User does not exist");

	const sentAtDate = new Date(sentAt);
	const messageAge = Date.now() - sentAtDate.getTime();
	if (messageAge < 0)
		return ctx.throw(400, "Cannot send messages from the future");
	if (messageAge > MESSAGE_AGE_LIMIT) return ctx.throw(400, "Message too old");

	const targets = await deviceManager.findMessageTargets(
		to,
		userData.id,
		ctx.state.device
	);
	const targetIds = targets.map((device) => device.id.toHexString());

	const idDiff = arrayDiff(Object.keys(bodies), targetIds);
	if (idDiff.missing.length > 0)
		return ctx.throw(400, "Missing required target device(s)");
	if (idDiff.extra.length > 0)
		return ctx.throw(400, "Extraneous unknown device(s)");

	await messageManager.createMany(
		Object.entries(bodies).map(([deviceId, body]) => ({
			fromUser: userData.id,
			toUser: to,
			toDevice: deviceId,
			sentAt: new Date(sentAt),
			headers,
			body
		}))
	);

	ctx.status = 201;
	return next();
});

messages.get("/poll", async (ctx, next) => {
	const deviceId = ctx.state.device as ID;
	const messageCtrs = await messageManager.poll(deviceId);
	ctx.body = messageCtrs.map((messageCtr: MessageController) => ({
		fromUser: messageCtr.get("fromUser").toHexString(),
		sentAt: messageCtr.get("sentAt").toISOString(),
		headers: mapToRecord(messageCtr.get("headers")),
		body: messageCtr.get("body")
	}));

	return next();
});

export default messages;
