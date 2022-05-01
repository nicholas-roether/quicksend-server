import Router from "@koa/router";
import user from "./api/user";
import devices from "./api/devices";
import bodyParser from "koa-bodyparser";

const router = new Router();
router.use(bodyParser());
router.use(user.routes(), user.allowedMethods());
router.use(devices.routes(), devices.allowedMethods());

export default router;
