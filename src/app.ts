import Koa from "koa";
import errorHandler from "./errors";
import router from "./router";
import responseHandler from "./response";
import compress from "./compress";

const app = new Koa();

app.use(compress());
app.use(responseHandler());
app.use(errorHandler());

app.use(router.routes());
app.use(router.allowedMethods());

export default app;
