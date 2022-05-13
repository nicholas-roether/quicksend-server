import { Device } from "src/db/schemas/device";
import Controller from "./controller";
import { DBObjField, Doc } from "./types";

class DeviceController extends Controller<Device> {
	constructor(document: Doc<Device>, defined?: readonly DBObjField<Device>[]) {
		super(
			document,
			defined ?? [
				"createdAt",
				"encryptionPublicKey",
				"lastActivity",
				"name",
				"signaturePublicKey",
				"type",
				"updatedAt",
				"user"
			]
		);
	}
}

export default DeviceController;
