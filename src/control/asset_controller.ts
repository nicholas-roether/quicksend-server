import { Asset } from "src/db/schemas/asset";
import Controller from "./controller";
import { DBObjField, Doc } from "./types";

class AssetController extends Controller<Asset> {
	constructor(document: Doc<Asset>, defined?: readonly DBObjField<Asset>[]) {
		super(document, defined ?? ["data", "mimeType"]);
	}
}

export default AssetController;
