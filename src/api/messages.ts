import Router from "@koa/router";
import Joi from "joi";
import mongoose from "mongoose";
import authHandler, { UserData } from "src/authorization/handler";
import bodyValidator from "src/body_validator";
import DeviceModel from "src/db/models/device";
import MessageModel from "src/db/models/message";
import UserModel from "src/db/models/user";
import { arrayDiff } from "src/utils";

const messages = new Router({ prefix: "/messages" });
messages.use(authHandler("Signature"));

messages.get("/targets/:userId", async (ctx, next) => {
	const userId = ctx.params.userId;
	if (!mongoose.Types.ObjectId.isValid(userId))
		return ctx.throw(400, "Invalid user id");

	if (!(await UserModel.exists({ _id: userId })))
		return ctx.throw(400, "User does not exist");

	const devices = await DeviceModel.find({ user: userId })
		.select("encryptionPublicKey")
		.exec();

	const ids: string[] = devices.map((device) => device.encryptionPublicKey);
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
	if (!mongoose.Types.ObjectId.isValid(to))
		return ctx.throw(400, "Invalid recipient user id");
	if (!(await UserModel.exists({ _id: to })))
		return ctx.throw(400, "User does not exist");

	const sentAtDate = new Date(sentAt);
	const messageAge = Date.now() - sentAtDate.getTime();
	if (messageAge < 0)
		return ctx.throw(400, "Cannot send messages from the future");
	if (messageAge > MESSAGE_AGE_LIMIT) return ctx.throw(400, "Message too old");

	const targetDevices = await DeviceModel.find({ user: to })
		.select("_id")
		.exec();
	const targetIds = targetDevices.map((device) => device._id.toHexString());

	const idDiff = arrayDiff(Object.keys(bodies), targetIds);
	if (idDiff.missing.length > 0)
		return ctx.throw(400, "Missing required target device(s)");
	if (idDiff.extra.length > 0)
		return ctx.throw(400, "Extraneous unknown device(s)");

	const messages = Object.entries(bodies).map(([deviceId, body]) => {
		return new MessageModel({
			fromUser: userData.id,
			toDevice: deviceId,
			sentAt: new Date(sentAt),
			headers,
			body
		});
	});
	await Promise.all(messages.map((message) => message.save()));

	return next();
});

export default messages;
