import { collapseWhitespace, decodeBase64 } from "quicksend-server/utils";
import {
	AuthorizationRequest,
	BasicAuthorizationRequest,
	SignatureAuthorizationRequest,
	UnknownAuthorizationRequest
} from "./schemes";

function parseHeaders(headerString: string): string[] {
	return collapseWhitespace(headerString).split(" ");
}

function parseSignatureAuth(
	params: Record<string, string>
): SignatureAuthorizationRequest | null {
	const { keyId, signature, headers, algorithm } = params;
	if (!keyId || !signature) return null;
	return new SignatureAuthorizationRequest({
		keyId,
		signature,
		headers: headers ? parseHeaders(headers) : undefined,
		algorithm
	});
}

function parseBasicAuth(paramString: string): BasicAuthorizationRequest | null {
	const decoded = decodeBase64(paramString);
	const res = decoded.match(/^([^:]+):([^:]+)$/);
	if (!res) return null;
	return new BasicAuthorizationRequest(res[1], res[2]);
}

function parseAuthorizationParams(
	paramString: string
): Record<string, string> | null {
	const params: Record<string, string> = {};
	const assignmentStrings = paramString.split(",");
	for (const assignmentString of assignmentStrings) {
		if (!assignmentString) continue;
		const res = assignmentString
			.trim()
			.match(/^([a-z0-9_-]+)=(?:"([^"]*)"|'([^']*)')$/i);
		if (!res) return null;
		const key = res[1];
		const val = res[2] ?? res[3];
		params[key] = val;
	}
	return params;
}

function parseAuthorization(
	authorization: string
): AuthorizationRequest | null {
	if (!authorization) return null;
	const normalized = authorization.trim();
	const res = normalized.match(/^([a-z0-9_-]+)(?: +(.+))?$/i);
	if (!res) return null;
	const schema = res[1];
	const paramString = res[2] ?? "";
	const params =
		schema != "Basic" ? parseAuthorizationParams(paramString) : null;
	switch (schema) {
		case "Basic":
			return parseBasicAuth(paramString);
		case "Signature":
			if (!params) return null;
			return parseSignatureAuth(params);
		default:
			return new UnknownAuthorizationRequest();
	}
}

export default parseAuthorization;
