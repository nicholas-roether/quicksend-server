import mongoose from "mongoose";
import { TimestampedDBObject } from "./base";

interface User extends TimestampedDBObject {
	username: string;
	display?: string;
	passwordHash: string;
}

const UserSchema = new mongoose.Schema<User>(
	{
		username: { type: String, required: true, unique: true, index: true },
		display: String,
		passwordHash: { type: String, required: true }
	},
	{ timestamps: true }
);

export default UserSchema;
export type { User };
