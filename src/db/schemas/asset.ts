import mongoose from "mongoose";
import { DBObject } from "./base";

interface Asset extends DBObject {
	mimeType: string;
	data: Buffer;
}

const AssetSchema = new mongoose.Schema<Asset>({
	mimeType: { type: String, required: true },
	data: { type: mongoose.SchemaTypes.Buffer, required: true }
});

export default AssetSchema;
export type { Asset };
