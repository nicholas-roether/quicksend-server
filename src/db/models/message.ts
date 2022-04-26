import mongoose from "mongoose";
import MessageSchema from "db/schemas/message";

const MessageModel = mongoose.model("message", MessageSchema);

export default MessageModel;
