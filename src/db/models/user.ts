import mongoose from "mongoose";
import UserSchema from "quicksend-server/db/schemas/user";

const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
