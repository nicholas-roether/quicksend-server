import Router from "@koa/router";
import user from "./api/user";
import bodyParser from "koa-bodyparser";

const router = new Router();
router.use(bodyParser());
router.use(user.routes(), user.allowedMethods());

export default router;
