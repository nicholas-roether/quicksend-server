import mongoose from "mongoose";
import MessageSchema from "../schemas/message";

const MessageModel = mongoose.model("message", MessageSchema);

export default MessageModel;
