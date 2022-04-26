import mongoose from "mongoose";
import DeviceSchema from "db/schemas/device";

const DeviceModel = mongoose.model("device", DeviceSchema);

export default DeviceModel;
