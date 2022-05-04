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
		const docs = await this.Model.find({ user })
			.select("name type lastActivity createdAt updatedAt")
			.exec();
		return this.createControllers(docs);
	}

	async listIDs(user: ID): Promise<DeviceController[]> {
		const docs = await this.Model.find({ user }).select("").exec();
		return this.createControllers(docs);
	}

	async listEncryptionKeys(user: ID): Promise<DeviceController[]> {
		const docs = await this.Model.find({ user })
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
