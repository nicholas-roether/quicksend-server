import "./config";
import mongoose from "mongoose";
import { requireEnvVar } from "./utils";
import app from "./app";

const server = app.listen(process.env.PORT);
const address = server.address();
if (!address) {
	console.error("An unexpected error occurred while starting the server");
	server.close();
} else if (typeof address == "string") {
	console.log(`Listening on ${address}...`);
} else {
	console.log(`Listening on port ${address.port} (${address.address})...`);
}

mongoose
	.connect(requireEnvVar("DB_URI"))
	.then(() => console.log("Database connected"));

export default server;
