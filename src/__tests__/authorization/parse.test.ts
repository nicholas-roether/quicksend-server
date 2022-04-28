import assert from "assert";
import parseAuthorization from "src/authorization/parse";
import { encodeBase64 } from "src/utils";

describe("parseAuthorization()", () => {
	test("correctly handles unknown auth schemes", () => {
		expect(parseAuthorization("dgfsdfghjghjf")).toHaveProperty(
			"name",
			"Unknown"
		);
		expect(parseAuthorization("dsfgjdfhg ertzrdtrdzth")).toHaveProperty(
			"name",
			"Unknown"
		);
	});
});

describe("parseAuthorization() for Basic auth", () => {
	test("correctly parses username and password", () => {
		const req = parseAuthorization(
			"Basic " + encodeBase64("some_user:password123")
		);
		expect(req).not.toBeNull();
		assert(req != null);
		expect(req.name).toBe("Basic");
		assert(req.name == "Basic");
		expect(req.username).toBe("some_user");
		expect(req.password).toBe("password123");
	});

	test("correctly handles incorrect tokens", () => {
		expect(parseAuthorization("Basic dffgdhdgfhj")).toBeNull();
		expect(
			parseAuthorization("Basic " + encodeBase64("some_user:"))
		).toBeNull();
		expect(parseAuthorization("Basic " + encodeBase64(":password"))).toBeNull();
	});

	test("correctly handles empty tokens", () => {
		expect(parseAuthorization("Basic")).toBeNull();
		expect(parseAuthorization("Basic ")).toBeNull();
	});
});

describe("parseAuthorization() for Signature auth", () => {
	test("correctly parses all parameters", () => {
		const req = parseAuthorization(
			"Signature keyId=\"key id\", signature='bla bla bla', headers=\"(request-target) date\", algorithm='some algorithm'"
		);
		expect(req).not.toBeNull();
		assert(req != null);
		expect(req.name).toBe("Signature");
		assert(req.name == "Signature");
		expect(req.keyId).toBe("key id");
		expect(req.signature).toBe("bla bla bla");
		expect(req.headers).toEqual(["(request-target)", "date"]);
		expect(req.algorithm).toBe("some algorithm");
	});

	test("correctly handles malformed headers", () => {
		expect(parseAuthorization("Signature sdxgfhrdftjhhdfgtjfdgj")).toBeNull();
		expect(parseAuthorization("Signature val=='")).toBeNull();
		expect(parseAuthorization("Signature val='asdfg' val2=''")).toBeNull();
		expect(parseAuthorization("Signature val='asdfg', fdfsgdgfh")).toBeNull();
	});

	test("allows missing optional parameters", () => {
		expect(
			parseAuthorization("Signature keyId='gdsghfgh', signature='bla bla'")
		).not.toBeNull();
	});

	test("fails on missing required parameter", () => {
		expect(parseAuthorization("Signature keyId='dsfghgd'")).toBeNull();
		expect(parseAuthorization("Signature singature='dfsghfgj'")).toBeNull();
	});
});
