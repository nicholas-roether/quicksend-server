import "./config";
import Koa from "koa";
import errorHandler from "./errors";
import router from "./router";
import responseHandler from "./response";

const app = new Koa();

app.use(responseHandler());
app.use(errorHandler());

router.get("/", (ctx, next) => {
	ctx.body = "Hi!";
	ctx.throw("test", 406);
	next();
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT);
console.log(`Listening on port ${process.env.PORT}...`);
