import "./config";
import Koa from "koa";
import errorMiddleware from "./errors";
import { dataResponse } from "./response";

const app = new Koa();

app.use(errorMiddleware);

app.use((ctx, next) => {
	dataResponse(ctx, "Hello World!");
	// ctx.throw("test2", 200);
	next();
});

app.listen(process.env.PORT);
console.log(`Listening on port ${process.env.PORT}...`);
