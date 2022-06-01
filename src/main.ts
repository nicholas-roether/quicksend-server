import app from "./app";
import createServer from "./server";

const server = createServer(app);

server.listen();
