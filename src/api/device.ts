import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "../auth";
import bodyValidator from "../body_validator";
import DeviceModel from "../db/models/device";
import { Device } from "../db/schemas/device";

const device = new Router({ prefix: "/device" });

interface AddDeviceRequest {
	name: string;
	/**
	 * @see Device
	 */
	type?: number;
	signaturePublicKey: string;
	encryptionPublicKey: string;
}

const addDeviceSchema = Joi.object<AddDeviceRequest>({
	name: Joi.string().min(3).max(30).required(),
	type: Joi.number().min(0),
	signaturePublicKey: Joi.string().required(),
	encryptionPublicKey: Joi.string().required()
});

device.post(
	"/add",
	authHandler({ authType: "Basic" }),
	bodyValidator(addDeviceSchema),
	async (ctx, next) => {
		const body = ctx.request.body as AddDeviceRequest;

		const userData = ctx.state.user as UserData;

		if (await DeviceModel.exists({ name: body.name, user: userData.id }).exec())
			return ctx.throw(400, "Device with this name already exists");
		const device = new DeviceModel({
			name: body.name,
			type: body.type,
			user: userData.id,
			signaturePublicKey: body.signaturePublicKey,
			encryptionPublicKey: body.encryptionPublicKey
		});
		await device.save();
		ctx.status = 201;
		ctx.body = { id: device._id };
		return next();
	}
);

interface RemoveDeviceRequest {
	id: string;
}

const removeDeviceSchema = Joi.object<RemoveDeviceRequest>({
	id: Joi.string().required()
});

device.post(
	"/remove",
	authHandler(),
	bodyValidator(removeDeviceSchema),
	async (ctx, next) => {
		const body = ctx.request.body as RemoveDeviceRequest;
		const userData = ctx.state.user as UserData;

		const device = await DeviceModel.findById(body.id).select("user").exec();
		if (!device) return ctx.throw(404, "Device not found");
		if (!device.user.equals(userData.id)) return ctx.throw(401, "Unauthorized");

		await device.remove();
		return next();
	}
);

device.get("/list", authHandler(), async (ctx, next) => {
	const userData = ctx.state.user as UserData;

	const devices = await DeviceModel.find({ user: userData.id })
		.select("name type lastActivity createdAt")
		.exec();

	ctx.body = devices.map((device) => ({
		id: device._id.toHexString(),
		name: device.name,
		type: device.type,
		lastActivity: device.lastActivity,
		createdAt: device.createdAt
	}));
	return next();
});

export default device;
