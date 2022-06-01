import "./config";
import fs from "fs";
import Koa from "koa";
import createApp from "./app";

class Server {
	private readonly app: Koa;

	constructor(app: Koa) {
		this.app = app;
	}

	listen() {
		const server = this.app.listen(process.env.PORT);

		const address = server.address();
		if (!address) {
			console.error("An unexpected error occurred while starting the server");
			server.close();
		} else if (typeof address == "string") {
			console.log(`Listening on ${address}...`);
		} else {
			console.log(`Listening on port ${address.port} (${address.address})`);
		}
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

function createServer(): Server {
	const httpsCert = loadHttpsCert();
	if (!httpsCert) {
		console.warn(
			"No HTTPS configuration found; Starting in HTTP mode. HTTP mode servers are INSECURE, and should ONLY be used for testing."
		);
		return new Server(createApp());
	}
	console.log("Starting in HTTPS mode.");
	return new Server(createApp(httpsCert));
}

export default createServer;
export { Server };
