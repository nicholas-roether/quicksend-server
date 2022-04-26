import Router from "@koa/router";
import user from "./api/user";
import device from "./api/device";
import bodyParser from "koa-bodyparser";

const router = new Router();
router.use(bodyParser());
router.use(user.routes(), user.allowedMethods());
router.use(device.routes(), device.allowedMethods());

export default router;
