import { Device } from "src/db/schemas/device";
import Controller from "./controller";
import { Doc } from "./types";

class DeviceController extends Controller<Device> {
	constructor(document: Doc<Device>) {
		super(document);
	}
}

export default DeviceController;
