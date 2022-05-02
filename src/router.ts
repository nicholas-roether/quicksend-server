import Router from "@koa/router";
import user from "./api/user";
import devices from "./api/devices";
import bodyParser from "koa-bodyparser";
import messages from "./api/messages";

const router = new Router();
router.use(bodyParser());
router.use(user.routes(), user.allowedMethods());
router.use(devices.routes(), devices.allowedMethods());
router.use(messages.routes(), messages.allowedMethods());

export default router;
