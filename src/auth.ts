import Koa from "koa";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import { collapseWhitespace, decodeBase64, splitAtIndex } from "./utils";
import UserModel from "./db/models/user";
import DeviceModel from "./db/models/device";
import { User } from "./db/schemas/user";

interface BasicAuthParams {
	username: string;
	password: string;
}

interface SignatureAuthParams {
	keyId: string;
	signature: string;
	algorithm?: string;
	created?: Date;
	expires?: Date;
	headers?: string;
}

function parseAuthParams(
	ctx: Koa.Context,
	paramString: string
): Map<string, string> {
	const params = new Map<string, string>();
	const statemets = paramString.replace(/ /g, "").split(",");
	for (const statement of statemets) {
		const [key, valueInQuotes] = splitAtIndex(
			statement,
			statement.indexOf("=")
		);
		if (
			!/^[a-z0-9_-]+$/i.test(key) ||
			!/^("[^"]*"|'[^']*')$/.test(valueInQuotes)
		)
			ctx.throw(400, `Malformed authorization parameter '${key}'`);
		const value = valueInQuotes.substring(1, valueInQuotes.length - 1);
		params.set(key, value);
	}
	return params;
}

function parseAuthorization(ctx: Koa.Context, requiredScheme: string): string {
	const normalizedAuth = collapseWhitespace(ctx.get("Authorization"));
	if (!normalizedAuth.includes(" "))
		return ctx.throw(400, "Malformed authorization header");
	const [scheme, paramString] = splitAtIndex(
		normalizedAuth,
		normalizedAuth.indexOf(" ")
	);
	if (scheme.toLowerCase() != requiredScheme.toLowerCase())
		return ctx.throw(400, "Unsupported authorization scheme");
	return paramString;
}

function parseBasicAuthScheme(ctx: Koa.Context): BasicAuthParams {
	const paramString = parseAuthorization(ctx, "Basic");
	const decoded = decodeBase64(paramString);
	const res = decoded.match(/^(.+):(.+)$/);
	if (!res) ctx.throw(400, "Malformed login token");
	return {
		username: res[1],
		password: res[2]
	};
}

function parseSignatureAuthScheme(ctx: Koa.Context): SignatureAuthParams {
	const paramString = parseAuthorization(ctx, "Signature");
	const params = parseAuthParams(ctx, paramString);
	if (!params.has("keyId") || !params.has("signature"))
		return ctx.throw(400, "Malformed authorization header");
	return {
		keyId: params.get("keyId") as string,
		signature: params.get("signature") as string,
		algorithm: params.get("algorithm"),
		created: params.has("created")
			? new Date(params.get("created") as string)
			: undefined,
		expires: params.has("expires")
			? new Date(params.get("expires") as string)
			: undefined,
		headers: params.get("headers")
	};
}

interface UserData {
	id: mongoose.Types.ObjectId;
	username: string;
	display?: string;
}

async function authenticateBasic(ctx: Koa.Context) {
	const { username, password } = parseBasicAuthScheme(ctx);
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

async function authenticateSignature(ctx: Koa.Context) {
	const params = parseSignatureAuthScheme(ctx);
	const device = await DeviceModel.findById(params.keyId)
		.select("signaturePublicKey user")
		.populate<{ user: User & { _id: mongoose.Types.ObjectId } }>(
			"user",
			"username display"
		)
		.exec();
	if (!device) return ctx.throw(400, "Unknown device id");
	if (
		!crypto.verify(
			params.algorithm,
			ctx.request.body,
			device.signaturePublicKey,
			Buffer.from(params.signature)
		)
	)
		return ctx.throw(401, "Device is not authorized to perform this action");
	ctx.state.user = {
		id: device.user._id,
		username: device.user.username,
		display: device.user.display
	} as UserData;
}

interface AuthHandlerOptions {
	authType?: "Basic" | "Signature";
}

function authHandler(options?: AuthHandlerOptions): Koa.Middleware {
	const authType = options?.authType ?? "Signature";
	return async (ctx, next) => {
		if (!ctx.get("Authorization")) {
			ctx.set("WWW-Authenticate", `${authType}, charset="utf-8"`);
			return ctx.throw(401, "Unauthorized");
		}
		switch (authType) {
			case "Basic":
				await authenticateBasic(ctx);
				break;
			case "Signature":
				await authenticateSignature(ctx);
		}
		return next();
	};
}

export default authHandler;
export type { UserData };
