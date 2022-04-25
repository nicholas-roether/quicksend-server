import mongoose from "mongoose";

interface Device {
	name: string;
	signaturePublicKey: string;
}

const DeviceSchema = new mongoose.Schema<Device>({
	name: { type: String, required: true },
	signaturePublicKey: { type: String, required: true }
});

export default DeviceSchema;
export type { Device };
