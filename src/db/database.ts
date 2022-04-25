import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { requireEnvVar } from "../config";
import { Device } from "./schemas/device";
import UserModel from "./models/user";
import DeviceModel from "./models/device";

const PASSWORD_SALT_LENGTH = 10;

class Database {
	private static instance: Database | null = null;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	async connect(): Promise<void> {
		await mongoose.connect(requireEnvVar("DB_URI"));
	}

	async userExists(username: string): Promise<boolean> {
		const res = await UserModel.exists({ username }).exec();
		return !!res;
	}

	async createUser(username: string, password: string) {
		const passwordHash = bcrypt.hashSync(password, PASSWORD_SALT_LENGTH);
		const newUser = new UserModel({
			username,
			passwordHash
		});
		await newUser.save();
	}

	async deviceExists(username: string, name: string) {
		const user = await UserModel.findOne({ username })
			.select("devices")
			.populate<{ devices: Device[] }>("devices")
			.exec();
		if (!user) return false;
		return user.devices.some((device) => device.name == name);
	}

	async addDevice(username: string, name: string, signaturePublicKey: string) {
		const device = new DeviceModel({ name, signaturePublicKey });
		await device.save();
		await UserModel.updateOne({ username }, { $push: { devices: device._id } });
	}

	async setDisplayName(username: string, display: string) {
		await UserModel.updateOne({ username }).set({ display }).exec();
	}

	static getInstance(): Database {
		if (!this.instance) this.instance = new Database();
		return this.instance;
	}
}

const db = Database.getInstance();
export default db;
