import mongoose from "mongoose";
import UserModel from "../models/user";

interface Device {
	name: string;
	user: mongoose.Types.ObjectId;
	signaturePublicKey: string;
}

const DeviceSchema = new mongoose.Schema<Device>({
	name: { type: String, required: true },
	user: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: UserModel },
	signaturePublicKey: { type: String, required: true }
});

export default DeviceSchema;
export type { Device };
