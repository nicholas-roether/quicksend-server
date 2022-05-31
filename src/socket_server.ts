import Koa from "koa";
import ws from "ws";
import { ID, ObjectId } from "./control/types";
import crypto from "crypto";
import EventEmitter from "events";
import { idToString } from "./control/utils";

type SocketContext = Koa.ParameterizedContext<
	Koa.DefaultState,
	Koa.DefaultContext & { websocket: ws.WebSocket }
>;

class BroadcastEvent {
	readonly name: string;
	readonly data: unknown;

	constructor(name: string, data: unknown) {
		this.name = name;
		this.data = data;
	}

	toJSON() {
		return JSON.stringify({ event: this.name, data: this.data });
	}
}

class SocketServer extends EventEmitter {
	private static readonly TOKEN_LIFETIME = 5000; // 5 seconds

	private readonly tokenMap = new Map<string, ObjectId>();

	handler(): Koa.Middleware<Koa.DefaultState, SocketContext> {
		return async (ctx, next) => {
			const userId = await this.authenticate(ctx);
			if (!userId) return next();
			this.subsribeSocket(userId, ctx.websocket);
			return next();
		};
	}

	grantToken(user: ObjectId): string {
		const token = crypto.randomBytes(16).toString("base64");
		this.tokenMap.set(token, user);
		setTimeout(() => this.revokeToken(token), SocketServer.TOKEN_LIFETIME);
		return token;
	}

	emitEvent(user: ID, name: string, data?: unknown) {
		this.emit(idToString(user), new BroadcastEvent(name, data));
	}

	private subsribeSocket(user: ObjectId, socket: ws.WebSocket) {
		const listener = (evt: BroadcastEvent) => {
			socket.send(evt.toJSON());
		};
		this.on(user.toHexString(), listener);
		socket.on("close", () => {
			this.removeListener(user.toHexString(), listener);
		});
		socket.on("error", () => {
			socket.close();
		});
	}

	private revokeToken(token: string) {
		this.tokenMap.delete(token);
	}

	private error(ctx: SocketContext, code: number, msg: string) {
		ctx.websocket.close(code, msg);
	}

	private async authenticate(ctx: SocketContext): Promise<ObjectId | null> {
		return await new Promise((res) => {
			let authenticated = false;
			const authListener = (data: ws.RawData) => {
				ctx.websocket.removeListener("message", authListener);
				const userId = this.tokenMap.get(data.toString("base64"));
				if (!userId) {
					this.error(ctx, 3002, "Invalid auth token");
					res(null);
					return;
				}
				authenticated = true;
				res(userId);
			};
			ctx.websocket.on("message", authListener);
			setTimeout(() => {
				if (authenticated) return;
				ctx.websocket.removeListener("message", authListener);
				this.error(
					ctx,
					3001,
					"Must provide authentication token within 5 seconds of connection"
				);
			}, 5000);
		});
	}
}

const socketServer = new SocketServer();

export default socketServer;
