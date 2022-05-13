import mongoose from "mongoose";
import { ID } from "./types";

function isValidID(id: ID) {
	return mongoose.Types.ObjectId.isValid(id);
}

function idToString(id: ID) {
	if (typeof id == "string") return id;
	return id.toHexString();
}

export { isValidID, idToString };
