import mongoose from "mongoose";
import DeviceSchema from "../schemas/device";

const DeviceModel = mongoose.model("device", DeviceSchema);

export default DeviceModel;
