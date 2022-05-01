import mongoose from "mongoose";
import UserModel from "src/db/models/user";
import { TimestampedDBObject } from "./base";

interface Device extends TimestampedDBObject {
	name: string;
	/**
	 * ### Type meanings
	 * | number | meaning                 |
	 * |--------|-------------------------|
	 * |      0 | Unknown device type     |
	 * |      1 | Mobile device           |
	 * |      2 | Desktop device          |
	 * |     3+ | Unused                  |
	 */
	type: number;
	user: mongoose.Types.ObjectId;
	lastActivity: Date;
	signaturePublicKey: string;
	encryptionPublicKey: string;
}

const DeviceSchema = new mongoose.Schema<Device>(
	{
		name: { type: String, required: true },
		type: { type: Number, default: 0 },
		user: {
			type: mongoose.SchemaTypes.ObjectId,
			required: true,
			ref: UserModel
		},
		lastActivity: { type: Date, default: new Date() },
		signaturePublicKey: { type: String, required: true },
		encryptionPublicKey: { type: String, required: true }
	},
	{ timestamps: true }
);

export default DeviceSchema;
export type { Device };
