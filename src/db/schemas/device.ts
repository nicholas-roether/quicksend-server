import mongoose from "mongoose";

interface Device {
	name: string;
	publicSignatureKey: string;
}

const DeviceSchema = new mongoose.Schema<Device>({
	name: { type: String, required: true },
	publicSignatureKey: { type: String, required: true }
});

export default DeviceSchema;
export type { Device };
