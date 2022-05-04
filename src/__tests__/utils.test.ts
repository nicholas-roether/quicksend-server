import { expect } from "chai";
import {
	arrayDiff,
	collapseWhitespace,
	decodeBase64,
	encodeBase64,
	includesAll,
	requireEnvVar,
	splitAtIndex
} from "src/utils";

describe("collapseWhitespace()", () => {
	it("should make no changes to a string containing no whitespace", () => {
		const str = "ggfdjhntghjfkmtgufksdt35";
		expect(collapseWhitespace(str)).to.equal(str);
	});
	it("should make no changes to single whitespace characters", () => {
		const str = "sgfgdsh tertrtz dsghgf";
		expect(collapseWhitespace(str)).to.equal(str);
	});
	it("should collapses whitespace", () => {
		expect(collapseWhitespace("sdfg   fgdh  asds weerw   a")).to.equal(
			"sdfg fgdh asds weerw a"
		);
	});

	it("should remove leading whitespace", () => {
		expect(collapseWhitespace(" abc")).to.equal("abc");
		expect(collapseWhitespace("   abc")).to.equal("abc");
	});

	it("should remove trailing whitespace", () => {
		expect(collapseWhitespace("abc ")).to.equal("abc");
		expect(collapseWhitespace("abc   ")).to.equal("abc");
	});
});

describe("splitAtIndex()", () => {
	it("should correctly split around positive indecies", () => {
		expect(splitAtIndex("abcde", 2)).to.deep.equal(["ab", "de"]);
	});
	it("should handle splitting around zero", () => {
		expect(splitAtIndex("abcde", 0)).to.deep.equal(["", "bcde"]);
	});
	it("should handle too high indecies", () => {
		expect(splitAtIndex("abcde", 5)).to.deep.equal(["abcde", ""]);
		expect(splitAtIndex("abcde", 10)).to.deep.equal(["abcde", ""]);
	});
	it("should handle negative indecies", () => {
		expect(splitAtIndex("abcde", -2)).to.deep.equal(["abcde", ""]);
	});
});

describe("encodeBase64()", () => {
	it("should produce correct base64 encodings", () => {
		expect(encodeBase64("test test test")).to.equal("dGVzdCB0ZXN0IHRlc3Q=");
	});
});

describe("decodeBase64()", () => {
	it("should correctly decode base64", () => {
		expect(decodeBase64("dGVzdCB0ZXN0IHRlc3Q")).to.equal("test test test");
	});
});

describe("includesAll()", () => {
	it("should recognize subsets", () => {
		expect(includesAll([1, 2, 3, 4], 3, 1)).to.equal(true);
	});
	it("should recognize unincluded items", () => {
		expect(includesAll([1, 2, 3, 4], 5, 1)).to.equal(false);
	});
});

describe("requireEnvVar()", () => {
	it("should throw an error if the requested environemnt variable is not set", () => {
		delete process.env.TEST_ENV_VAR;
		expect(() => requireEnvVar("TEST_ENV_VAR")).to.throw();
	});

	it("should return the value if the environment variable is set", () => {
		process.env.TEST_ENV_VAR = "some_value";
		expect(requireEnvVar("TEST_ENV_VAR")).to.equal("some_value");
	});
});

describe("arrayDiff()", () => {
	it("should return no differences for identical arrays", () => {
		expect(arrayDiff([1, 2, 3], [1, 2, 3])).to.deep.equal({
			missing: [],
			extra: []
		});
	});

	it("should recognize missing items", () => {
		expect(arrayDiff([1, 3], [1, 2, 3, 4, 5])).to.deep.equal({
			missing: [2, 4, 5],
			extra: []
		});
	});

	it("should recognize extraneous items", () => {
		expect(arrayDiff([1, 2, 3, 4, 5], [1, 3, 4])).to.deep.equal({
			missing: [],
			extra: [2, 5]
		});
	});

	it("should recognize both missing and extraneous items simultaneously", () => {
		expect(arrayDiff([1, 4, 5, 7, 9], [1, 2, 3, 4, 5, 6])).to.deep.equal({
			missing: [2, 3, 6],
			extra: [7, 9]
		});
	});
});
