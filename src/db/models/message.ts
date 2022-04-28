import mongoose from "mongoose";
import MessageSchema from "quicksend-server/db/schemas/message";

const MessageModel = mongoose.model("message", MessageSchema);

export default MessageModel;
