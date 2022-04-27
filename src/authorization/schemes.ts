type AuthorizationScheme = "Basic" | "Signature" | "Unknown";

class AuthorizationRequestBase<T extends AuthorizationScheme> {
	public readonly name: T;

	constructor(name: T) {
		this.name = name;
	}
}

class UnknownAuthorizationRequest extends AuthorizationRequestBase<"Unknown"> {
	constructor() {
		super("Unknown");
	}
}

class BasicAuthorizationRequest extends AuthorizationRequestBase<"Basic"> {
	public readonly username;
	public readonly password;

	constructor(username: string, password: string) {
		super("Basic");
		this.username = username;
		this.password = password;
	}
}

interface SignatureAuthorizationRequestInit {
	readonly keyId: string;
	readonly signature: string;
	readonly headers?: string[];
	readonly algorithm?: string;
}

class SignatureAuthorizationRequest
	extends AuthorizationRequestBase<"Signature">
	implements SignatureAuthorizationRequestInit
{
	public readonly keyId: string;
	public readonly signature: string;
	public readonly headers?: string[];
	public readonly algorithm?: string | undefined;

	constructor({
		keyId,
		signature,
		headers,
		algorithm
	}: SignatureAuthorizationRequestInit) {
		super("Signature");
		this.keyId = keyId;
		this.signature = signature;
		this.headers = headers;
		this.algorithm = algorithm;
	}
}

type AuthorizationRequest =
	| BasicAuthorizationRequest
	| SignatureAuthorizationRequest
	| UnknownAuthorizationRequest;

export {
	BasicAuthorizationRequest,
	SignatureAuthorizationRequest,
	UnknownAuthorizationRequest
};
export type { AuthorizationRequest };
