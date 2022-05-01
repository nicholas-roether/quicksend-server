import Koa from "koa";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import parseAuthorization from "./parse";
import {
	BasicAuthorizationRequest,
	SignatureAuthorizationRequest
} from "./schemes";
import UserModel from "src/db/models/user";
import { includesAll } from "src/utils";
import DeviceModel from "src/db/models/device";
import { User } from "src/db/schemas/user";

interface UserData {
	id: mongoose.Types.ObjectId;
	username: string;
	display?: string;
}

async function authenticateBasic(
	ctx: Koa.Context,
	req: BasicAuthorizationRequest
) {
	const { username, password } = req;
	const user = await UserModel.findOne({ username }).exec();
	if (!user) return ctx.throw(400, "User doesn't exist");
	if (!bcrypt.compareSync(password, user.passwordHash))
		return ctx.throw(401, "Invalid credentials");
	ctx.state.user = {
		id: user._id,
		username: user.username,
		display: user.display
	} as UserData;
}

function createSignatureString(ctx: Koa.Context, headers: string[]) {
	let signatureStr = "";
	for (const header of headers) {
		let value: string;
		if (header == "(request-target)")
			value = `${ctx.method.toLowerCase()} ${ctx.url}`;
		else value = ctx.get(header);
		if (!value)
			return ctx.throw(
				400,
				`Cannot use unspecified header '${header}' for signature`
			);
		signatureStr += `${header}: ${value}\n`;
	}
	return signatureStr;
}

const signatureRequiredHeaders = ["(request-target)", "date"];

async function authenticateSignature(
	ctx: Koa.Context,
	req: SignatureAuthorizationRequest
) {
	const headers = req.headers ?? ["date"];
	if (!includesAll(headers, ...signatureRequiredHeaders))
		return ctx.throw(400, "missing reqired header for signature");
	let deviceId: mongoose.Types.ObjectId;
	try {
		deviceId = new mongoose.Types.ObjectId(req.keyId);
	} catch (err) {
		ctx.throw(400, "invalid device id");
	}
	const device = await DeviceModel.findById(deviceId)
		.select("signaturePublicKey user")
		.exec();
	if (!device) return ctx.throw(401, "Unregistered device");
	const signatureStr = createSignatureString(ctx, headers);
	const result = crypto.verify(
		req.algorithm,
		Buffer.from(signatureStr),
		device.signaturePublicKey,
		Buffer.from(req.signature, "base64")
	);
	if (!result) return ctx.throw(401, "Incorrect signature");
	await device.populate("user");
	const user = device.user as unknown as User;
	if (!device) ctx.throw(500, "Unexpected error");
	ctx.state.user = {
		id: user._id,
		username: user.username,
		display: user.display
	} as UserData;
}

type AuthType = "Basic" | "Signature";

const authenticateHeaderMap: Record<AuthType, string> = {
	Basic: 'Basic charset="utf-8"',
	Signature: `Signature headers="${signatureRequiredHeaders.join(
		" "
	)}",charset="utf-8"`
};

function authHandler(authType: AuthType = "Signature"): Koa.Middleware {
	return async (ctx, next) => {
		if (!ctx.get("Authorization")) {
			ctx.set("WWW-Authenticate", authenticateHeaderMap[authType]);
			return ctx.throw(401, "Unauthorized");
		}
		const authReq = parseAuthorization(ctx.get("Authorization"));
		if (!authReq) return ctx.throw(400, "Malformed authorization header");
		if (authReq.name != authType)
			return ctx.throw(
				400,
				"Authorization scheme not supported for this request"
			);
		switch (authReq.name) {
			case "Basic":
				await authenticateBasic(ctx, authReq);
				break;
			case "Signature":
				await authenticateSignature(ctx, authReq);
		}
		return next();
	};
}

export default authHandler;
export type { UserData };
