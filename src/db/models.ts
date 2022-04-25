import mongoose from "mongoose";
import DeviceSchema from "./schemas/device";
import MessageSchema from "./schemas/message";
import UserSchema from "./schemas/user";

const DeviceModel = mongoose.model("device", DeviceSchema);
const UserModel = mongoose.model("user", UserSchema);
const MessageModel = mongoose.model("message", MessageSchema);

export { DeviceModel, UserModel, MessageModel };
