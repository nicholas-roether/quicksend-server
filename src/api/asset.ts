import Router from "@koa/router";
import assetManager from "src/control/asset_manager";
import { isValidID } from "src/control/utils";

const asset = new Router({ prefix: "/asset" });

asset.get("/:id", async (ctx, next) => {
	if (!isValidID(ctx.params.id)) {
		return ctx.throw(400, "Asset ID is invalid");
	}

	const assetCtr = await assetManager.findID(ctx.params.id);
	if (!assetCtr) {
		return ctx.throw(404, "Asset not found");
	}

	ctx.state.rawResponse = true;
	ctx.state.compress = true;
	ctx.set("Content-Type", assetCtr.get("mimeType"));
	ctx.body = assetCtr.get("data");

	return next();
});

export default asset;
