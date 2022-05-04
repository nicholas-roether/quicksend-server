import mongoose from "mongoose";
import { ID } from "./types";

function isValidID(id: ID) {
	return mongoose.Types.ObjectId.isValid(id);
}

export { isValidID };
