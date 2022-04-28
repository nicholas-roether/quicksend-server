import mongoose from "mongoose";
import DeviceSchema from "src/db/schemas/device";

const DeviceModel = mongoose.model("device", DeviceSchema);

export default DeviceModel;
