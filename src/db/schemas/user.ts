import mongoose from "mongoose";
import { ObjectId } from "src/control/types";
import AssetModel from "../models/asset";
import { TimestampedDBObject } from "./base";

interface User extends TimestampedDBObject {
	username: string;
	display?: string;
	passwordHash: string;
	status?: string;
	profilePicture?: ObjectId;
}

const UserSchema = new mongoose.Schema<User>(
	{
		username: { type: String, required: true, unique: true, index: true },
		display: String,
		passwordHash: { type: String, required: true },
		status: String,
		profilePicture: { type: mongoose.SchemaTypes.ObjectId, ref: AssetModel }
	},
	{ timestamps: true }
);

export default UserSchema;
export type { User };
