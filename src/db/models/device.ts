import mongoose from "mongoose";
import DeviceSchema from "quicksend-server/db/schemas/device";

const DeviceModel = mongoose.model("device", DeviceSchema);

export default DeviceModel;
