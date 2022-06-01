import "./config";
import fs from "fs";
import http from "http";
import https from "https";
import Koa from "koa";
import mongoose from "mongoose";
import { requireEnvVar } from "./utils";

class Server {
	private readonly httpServer: http.Server;

	constructor(httpServer: http.Server) {
		this.httpServer = httpServer;
	}

	listen() {
		this.httpServer.listen(process.env.PORT);

		const address = this.httpServer.address();
		if (!address) {
			console.error("An unexpected error occurred while starting the server");
			this.httpServer.close();
		} else if (typeof address == "string") {
			console.log(`Listening on ${address}...`);
		} else {
			console.log(`Listening on port ${address.port} (${address.address})...`);
		}

		mongoose
			.connect(requireEnvVar("DB_URI"))
			.then(() => console.log("Database connected"));
	}
}

class HttpServer extends Server {
	constructor(app: Koa) {
		super(http.createServer(app.callback()));
	}
}

class HttpsServer extends Server {
	constructor(certData: HttpsCertData, app: Koa) {
		super(https.createServer(certData, app.callback()));
	}
}

interface HttpsCertData {
	key: string;
	cert: string;
}

function loadHttpsCert(): HttpsCertData | null {
	const keyUri = process.env.HTTPS_KEY;
	const certUri = process.env.HTTPS_CERT;
	if (!keyUri || !certUri) return null;
	if (!fs.existsSync(keyUri) || !fs.existsSync(certUri)) return null;
	return {
		key: fs.readFileSync(keyUri).toString(),
		cert: fs.readFileSync(certUri).toString()
	};
}

function createServer(app: Koa): Server {
	const httpsCert = loadHttpsCert();
	if (!httpsCert) {
		console.warn(
			"No HTTPS configuration found; Starting in HTTP mode. HTTP mode servers are INSECURE, and should ONLY be used for testing."
		);
		return new HttpServer(app);
	}
	console.log("Starting in HTTPS mode.");
	return new HttpsServer(httpsCert, app);
}

export default createServer;
export { Server };
