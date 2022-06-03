import AssetModel from "src/db/models/asset";
import { Asset } from "src/db/schemas/asset";
import AssetController from "./asset_controller";
import Manager from "./manager";
import { DBObjField, Doc, ID } from "./types";

class AssetManager extends Manager<Asset, AssetController> {
	constructor() {
		super(AssetModel);
	}

	protected createController(
		document: Doc<Asset>,
		defined?: readonly DBObjField<Asset>[]
	): AssetController {
		return new AssetController(document, defined);
	}

	async deleteID(id: ID): Promise<void> {
		await this.Model.deleteOne({ _id: id });
	}
}

const assetManager = new AssetManager();

export default assetManager;
