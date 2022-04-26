import mongoose from "mongoose";

interface User {
	_id: mongoose.Types.ObjectId;
	username: string;
	display?: string;
	passwordHash: string;
	createdAt: Date;
	updatedAt: Date;
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
