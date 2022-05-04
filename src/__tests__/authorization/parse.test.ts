import { expect, assert } from "chai";
import parseAuthorization from "src/auth/parse";
import { encodeBase64 } from "src/utils";

describe("parseAuthorization()", () => {
	it("should return an Unknown scheme when appropriate", () => {
		expect(parseAuthorization("dgfsdfghjghjf")).to.have.property(
			"name",
			"Unknown"
		);
		expect(parseAuthorization("dsfgjdfhg ertzrdtrdzth")).to.have.property(
			"name",
			"Unknown"
		);
	});

	describe("Basic authorization", () => {
		it("should parse username and password", () => {
			const req = parseAuthorization(
				"Basic " + encodeBase64("some_user:password123")
			);
			assert(req != null);
			assert(req.name == "Basic");
			expect(req.username).to.equal("some_user");
			expect(req.password).to.equal("password123");
		});
		it("should should return null on invalid tokens", () => {
			expect(parseAuthorization("Basic dffgdhdgfhj")).to.be.null;
			expect(parseAuthorization("Basic " + encodeBase64("some_user:"))).to.be
				.null;
			expect(parseAuthorization("Basic " + encodeBase64(":password"))).to.be
				.null;
		});
		it("should return null on missing token", () => {
			expect(parseAuthorization("Basic")).to.be.null;
			expect(parseAuthorization("Basic ")).to.be.null;
		});
		it("should allow arbitrary spaces outside of quotes", () => {
			expect(
				parseAuthorization(
					"   Basic           " + encodeBase64("some_user:password123") + "    "
				)
			).to.have.property("name", "Basic");
		});
	});

	describe("Signature authorization", () => {
		it("should correctly parse all valid parameters", () => {
			const req = parseAuthorization(
				"Signature keyId=\"key id\", signature='bla bla bla', headers=\"(request-target) date\", algorithm='some algorithm'"
			);
			assert(req != null);
			assert(req.name == "Signature");
			expect(req.keyId).to.equal("key id");
			expect(req.signature).to.equal("bla bla bla");
			expect(req.headers).to.deep.equal(["(request-target)", "date"]);
			expect(req.algorithm).to.equal("some algorithm");
		});
		it("should ignore unknown parameters", () => {
			const req = parseAuthorization(
				"Signature keyId=\"key id\", signature='bla bla bla', val1='fgdsfghjd', headers=\"(request-target) date\", val3='gfsgdhf', test_test='tesst', algorithm='some algorithm'"
			);
			assert(req != null);
			assert(req.name == "Signature");
			expect(req.keyId).to.equal("key id");
			expect(req.signature).to.equal("bla bla bla");
			expect(req.headers).to.deep.equal(["(request-target)", "date"]);
			expect(req.algorithm).to.equal("some algorithm");
		});
		it("should return null on malformed parameter string", () => {
			expect(parseAuthorization("Signature sdxgfhrdftjhhdfgtjfdgj")).to.be.null;
			expect(parseAuthorization("Signature val=='")).to.be.null;
			expect(parseAuthorization("Signature val='asdfg' val2=''")).to.be.null;
			expect(parseAuthorization("Signature val='asdfg', fdfsgdgfh")).to.be.null;
		});
		it("should allow missing optional parameters", () => {
			expect(
				parseAuthorization("Signature keyId='gdsghfgh', signature='bla bla'")
			).not.to.be.null;
		});
		it("should return null on missing required parameter", () => {
			expect(parseAuthorization("Signature keyId='dsfghgd'")).to.be.null;
			expect(parseAuthorization("Signature singature='dfsghfgj'")).to.be.null;
		});
		it("should allow arbitrary spaces outside of quotes", () => {
			expect(
				parseAuthorization(
					"   Signature       keyId       =     'sdgfhjhdfg'           ,    signature='gfghfjgfjkjghf'"
				)
			).to.have.property("name", "Signature");
		});
	});
});
