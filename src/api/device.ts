import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "../auth";
import DeviceModel from "../db/models/device";

const device = new Router({ prefix: "/device" });

interface AddDeviceRequest {
	name: string;
	signaturePublicKey: string;
	encryptionPublicKey: string;
}

const addDeviceSchema = Joi.object<AddDeviceRequest>({
	name: Joi.string().min(3).max(30).required(),
	signaturePublicKey: Joi.string().required(),
	encryptionPublicKey: Joi.string().required()
});

device.post("/add", authHandler({ authType: "Basic" }), async (ctx, next) => {
	const { error, value: body } = addDeviceSchema.validate(ctx.request.body);
	if (error) return ctx.throw(error.message, 400);
	if (!body) return ctx.throw(500, "Unexpected error");

	const userData = ctx.state.user as UserData;

	if (await DeviceModel.exists({ name: body.name, user: userData.id }).exec())
		return ctx.throw(400, "Device with this name already exists");
	const device = new DeviceModel({
		name: body.name,
		user: userData.id,
		signaturePublicKey: body.signaturePublicKey,
		encryptionPublicKey: body.encryptionPublicKey
	});
	await device.save();
	ctx.status = 201;
	ctx.body = { id: device._id };
	return next();
});

export default device;
