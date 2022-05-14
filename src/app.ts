import Koa from "koa";
import cors from "koa-cors";
import errorHandler from "./errors";
import responseHandler from "./response";
import compress from "./compress";
import bodyParser from "koa-bodyparser";
import user from "./api/user";
import devices from "./api/devices";
import messages from "./api/messages";

const app = new Koa();

const middleware = [
	cors(),
	compress(),
	bodyParser(),
	responseHandler(),
	errorHandler(),
	user.routes(),
	user.allowedMethods(),
	devices.routes(),
	devices.allowedMethods(),
	messages.routes(),
	messages.allowedMethods()
];

function applyMiddleware(app: Koa) {
	middleware.forEach((mw) => app.use(mw));
}

applyMiddleware(app);

export default app;
