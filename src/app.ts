import Koa from "koa";
import cors from "koa-cors";
import websockify from "koa-websocket";
import errorHandler from "./errors";
import responseHandler from "./response";
import compress from "./compress";
import bodyParser from "koa-bodyparser";
import user from "./api/user";
import devices from "./api/devices";
import messages from "./api/messages";
import socketServer from "./socket_server";
import socket from "./api/socket";

const app = websockify(new Koa());

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
	messages.allowedMethods(),
	socket.routes(),
	socket.allowedMethods()
];

function applyMiddleware(app: Koa) {
	middleware.forEach((mw) => app.use(mw));
}

applyMiddleware(app);

app.ws.use(socketServer.handler());

export default app;
