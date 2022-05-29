import Router from "@koa/router";
import authHandler from "src/auth/handler";
import socketServer from "src/socket_server";

const socket = new Router({ prefix: "/socket" });
socket.use(authHandler("Signature"));

socket.get("/", (ctx, next) => {
	const token = socketServer.grantToken(ctx.state.user.id);
	ctx.body = { token };
	return next();
});

export default socket;
