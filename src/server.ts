import "./config";
import Koa from "koa";
import errorHandler from "./errors";
import router from "./router";
import responseHandler from "./response";
import mongoose from "mongoose";
import { requireEnvVar } from "./utils";

const app = new Koa();

app.use(responseHandler());
app.use(errorHandler());

app.use(router.routes());
app.use(router.allowedMethods());

const server = app.listen(/* process.env.PORT */);
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
