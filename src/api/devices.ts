import Router from "@koa/router";
import Joi from "joi";
import authHandler, { UserData } from "src/auth/handler";
import bodyValidator from "src/body_validator";
import deviceManager from "src/control/device_manager";
import messageManager from "src/control/message_manager";
import { isValidID } from "src/control/utils";

const devices = new Router({ prefix: "/devices" });

interface AddDeviceRequest {
	name: string;
	/**
	 * @see Device
	 */
	type?: number;
	signaturePublicKey: string;
	encryptionPublicKey: string;
}

const deviceNameSchema = Joi.string().min(3).max(30);

const addDeviceSchema = Joi.object<AddDeviceRequest>({
	name: deviceNameSchema.required(),
	type: Joi.number().min(0),
	signaturePublicKey: Joi.string().required(),
	encryptionPublicKey: Joi.string().required()
});

devices.post(
	"/add",
	authHandler("Basic"),
	bodyValidator(addDeviceSchema),
	async (ctx, next) => {
		const body = ctx.request.body as AddDeviceRequest;

		const userData = ctx.state.user as UserData;

		const deviceCtr = await deviceManager.create({
			name: body.name,
			type: body.type,
			user: userData.id,
			signaturePublicKey: body.signaturePublicKey,
			encryptionPublicKey: body.encryptionPublicKey
		});
		ctx.status = 201;
		ctx.body = { id: deviceCtr.id };
		return next();
	}
);

interface RemoveDeviceRequest {
	id: string;
}

const removeDeviceSchema = Joi.object<RemoveDeviceRequest>({
	id: Joi.string().required()
});

devices.post(
	"/remove",
	authHandler("Basic"),
	bodyValidator(removeDeviceSchema),
	async (ctx, next) => {
		const body = ctx.request.body as RemoveDeviceRequest;
		const userData = ctx.state.user as UserData;

		if (!isValidID(body.id)) return ctx.throw(400, "Not a valid device id");
		if (!(await deviceManager.idExistsForUser(body.id, userData.id)))
			return ctx.throw(400, "Device does not exist");
		await deviceManager.remove(body.id);
		await messageManager.clear(body.id);

		return next();
	}
);

devices.post("/remove-current", authHandler(), async (ctx, next) => {
	await deviceManager.remove(ctx.state.device);
	await messageManager.clear(ctx.state.device);
	return next();
});

devices.get("/list", authHandler(), async (ctx, next) => {
	const userData = ctx.state.user as UserData;

	const deviceCtrs = await deviceManager.list(userData.id);

	ctx.body = deviceCtrs.map((deviceCtr) => ({
		id: deviceCtr.id.toHexString(),
		name: deviceCtr.get("name"),
		type: deviceCtr.get("type"),
		lastActivity: deviceCtr.get("lastActivity").toISOString(),
		createdAt: deviceCtr.get("createdAt").toISOString(),
		updatedAt: deviceCtr.get("updatedAt").toISOString()
	}));
	return next();
});

interface DeviceUpdateRequest {
	id: string;
	name?: string;
}

const deviceUpdateSchema = Joi.object<DeviceUpdateRequest>({
	id: Joi.string().required(),
	name: deviceNameSchema.optional()
});

devices.post(
	"/update",
	authHandler(),
	bodyValidator(deviceUpdateSchema),
	async (ctx, next) => {
		const userData = ctx.state.user as UserData;
		const body = ctx.request.body as DeviceUpdateRequest;
		if (!isValidID(body.id)) return ctx.throw(400, "Not a valid device id");
		const deviceCtr = await deviceManager.findID(body.id);
		if (!deviceCtr || !deviceCtr.get("user").equals(userData.id))
			return ctx.throw(400, "Device does not exist for this user");
		if (body.name) deviceCtr.set("name", body.name);
		await deviceCtr.update();
		return next();
	}
);

export default devices;
