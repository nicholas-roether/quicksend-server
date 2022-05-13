import DeviceModel from "src/db/models/device";
import { Device } from "src/db/schemas/device";
import DeviceController from "./device_controller";
import Manager from "./manager";
import { DBObjField, Doc, ID } from "./types";

class DeviceManager extends Manager<Device, DeviceController> {
	constructor() {
		super(DeviceModel);
	}

	async nameExistsForUser(name: string, user: ID): Promise<boolean> {
		const queryRes = await this.Model.exists({ name, user }).exec();
		return !!queryRes;
	}

	async idExistsForUser(id: ID, user: ID): Promise<boolean> {
		const queryRes = await this.Model.exists({ _id: id, user }).exec();
		return !!queryRes;
	}

	async list(user: ID): Promise<DeviceController[]> {
		const proj: readonly DBObjField<Device>[] = [
			"name",
			"type",
			"lastActivity",
			"createdAt",
			"updatedAt"
		];
		const docs = await this.Model.find({ user }).select(proj.join(" ")).exec();
		return this.createControllers(docs, proj);
	}

	async findMessageTargets(
		targetUser: ID,
		senderUser: ID,
		senderDevice: ID
	): Promise<DeviceController[]> {
		const docs = await this.Model.find()
			.or([{ user: targetUser }, { user: senderUser }])
			.where({ _id: { $ne: senderDevice } })
			.select("encryptionPublicKey")
			.exec();
		return this.createControllers(docs);
	}

	protected createController(document: Doc<Device>): DeviceController {
		return new DeviceController(document);
	}
}

const deviceManager = new DeviceManager();

export default deviceManager;
