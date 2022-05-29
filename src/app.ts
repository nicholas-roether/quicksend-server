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

app
	.use(cors())
	.use(compress())
	.use(bodyParser())
	.use(responseHandler())
	.use(errorHandler())
	.use(user.routes())
	.use(user.allowedMethods())
	.use(devices.routes())
	.use(devices.allowedMethods())
	.use(messages.routes())
	.use(messages.allowedMethods())
	.use(socket.routes())
	.use(socket.allowedMethods());

app.ws.use(socketServer.handler());

export default app;
