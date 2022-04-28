import mongoose from "mongoose";
import UserSchema from "src/db/schemas/user";

const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
