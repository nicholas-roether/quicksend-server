import mongoose from "mongoose";
import createServer from "./server";
import { requireEnvVar } from "./utils";

const server = createServer();

server.listen();

mongoose
	.connect(requireEnvVar("DB_URI"))
	.then(() => console.log("Database connected"))
	.catch((err) => console.error("Database connection failed: " + err));
