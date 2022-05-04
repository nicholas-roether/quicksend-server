import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "src/auth/handler";
import bodyValidator from "src/body_validator";
import deviceManager from "src/control/device_manager";
import messageManager from "src/control/message_manager";
import userManager from "src/control/user_manager";
import { isValidID } from "src/control/utils";
import { arrayDiff } from "src/utils";

const messages = new Router({ prefix: "/messages" });
messages.use(authHandler("Signature"));

messages.get("/targets/:userId", async (ctx, next) => {
	const userId = ctx.params.userId;
	if (!isValidID(userId)) return ctx.throw(400, "Invalid user id");

	if (!(await userManager.idExists(userId)))
		return ctx.throw(400, "User does not exist");
	const deviceCtrs = await deviceManager.listEncryptionKeys(userId);

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
	headers: Joi.object().pattern(Joi.string(), Joi.string()).required(),
	bodies: Joi.object().pattern(Joi.string(), Joi.string()).required()
});

const MESSAGE_AGE_LIMIT = 300000; // 5 minutes

messages.post("/send", bodyValidator(sendMessageSchema), async (ctx, next) => {
	const userData = ctx.state.user as UserData;
	const { to, sentAt, headers, bodies } = ctx.body as SendMessageRequest;
	if (!isValidID(to)) return ctx.throw(400, "Invalid recipient user id");
	if (!(await userManager.idExists(to)))
		return ctx.throw(400, "User does not exist");

	const sentAtDate = new Date(sentAt);
	const messageAge = Date.now() - sentAtDate.getTime();
	if (messageAge < 0)
		return ctx.throw(400, "Cannot send messages from the future");
	if (messageAge > MESSAGE_AGE_LIMIT) return ctx.throw(400, "Message too old");

	const targetDevices = await deviceManager.listIDs(to);
	const targetIds = targetDevices.map((device) => device.id.toHexString());

	const idDiff = arrayDiff(Object.keys(bodies), targetIds);
	if (idDiff.missing.length > 0)
		return ctx.throw(400, "Missing required target device(s)");
	if (idDiff.extra.length > 0)
		return ctx.throw(400, "Extraneous unknown device(s)");

	await messageManager.createMany(
		Object.entries(bodies).map(([deviceId, body]) => ({
			fromUser: userData.id,
			toDevice: deviceId,
			sentAt: new Date(sentAt),
			headers,
			body
		}))
	);

	return next();
});

export default messages;
