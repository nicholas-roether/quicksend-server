import "./config";
import Koa from "koa";
import errorMiddleware from "./errors";
import router from "./router";

const app = new Koa();

app.use(errorMiddleware);

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT);
console.log(`Listening on port ${process.env.PORT}...`);
