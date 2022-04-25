import mongoose from "mongoose";
import DeviceModel from "../models/device";

interface User {
	username: string;
	display?: string;
	passwordHash: string;
	devices: mongoose.Types.ObjectId[];
}

const UserSchema = new mongoose.Schema<User>({
	username: { type: String, required: true, unique: true, index: true },
	display: String,
	passwordHash: { type: String, required: true },
	devices: {
		type: [mongoose.SchemaTypes.ObjectId],
		default: [],
		ref: DeviceModel
	}
});

export default UserSchema;
export type { User };
