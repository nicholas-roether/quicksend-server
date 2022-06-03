import mongoose from "mongoose";
import AssetSchema from "../schemas/asset";

const AssetModel = mongoose.model("asset", AssetSchema);

export default AssetModel;
