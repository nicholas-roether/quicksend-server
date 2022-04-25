import mongoose from "mongoose";
import UserSchema from "../schemas/user";

const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
