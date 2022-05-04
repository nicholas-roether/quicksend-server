import DeviceModel from "src/db/models/device";
import { Device } from "src/db/schemas/device";
import DeviceController from "./device_controller";
import Manager from "./manager";
import { Doc, ID } from "./types";

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
		const proj = "name type lastActivity createdAt updatedAt";
		const docs = await this.Model.find({ user }).select(proj).exec();
		return this.createControllers(docs, proj);
	}

	async listIDs(user: ID): Promise<DeviceController[]> {
		const docs = await this.Model.find({ user }).select("").exec();
		return this.createControllers(docs, "");
	}

	async listEncryptionKeys(user: ID): Promise<DeviceController[]> {
		const docs = await this.Model.find({ user })
			.select("encryptionPublicKey")
			.exec();
		return this.createControllers(docs, "encryptionPublicKey");
	}

	protected createController(
		document: Doc<Device>,
		proj?: string
	): DeviceController {
		return new DeviceController(document, proj);
	}
}

const deviceManager = new DeviceManager();

export default deviceManager;
