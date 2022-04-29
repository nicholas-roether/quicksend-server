import app from "src/app";

function createTestServer() {
	const server = app.listen();
	return server;
}

export { createTestServer };
