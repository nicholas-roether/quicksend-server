import {
	collapseWhitespace,
	decodeBase64,
	encodeBase64,
	splitAtIndex
} from "utils";

describe("collapseWhitespace()", () => {
	test("makes no changes to a string containing no whitespace", () => {
		const str = "ggfdjhntghjfkmtgufksdt35";
		expect(collapseWhitespace(str)).toEqual(str);
	});
	test("makes no changes to single whitespace characters", () => {
		const str = "sgfgdsh tertrtz dsghgf";
		expect(collapseWhitespace(str)).toEqual(str);
	});
	test("correctly collapses whitespace", () => {
		expect(collapseWhitespace("sdfg   fgdh  asds weerw   a")).toEqual(
			"sdfg fgdh asds weerw a"
		);
	});
});

describe("splitAtIndex()", () => {
	test("correctly splits around index", () => {
		expect(splitAtIndex("abcde", 2)).toEqual(["ab", "de"]);
		expect(splitAtIndex("abcde", 0)).toEqual(["", "bcde"]);
	});
	test("correctly handles too high indecies", () => {
		expect(splitAtIndex("abcde", 5)).toEqual(["abcde", ""]);
		expect(splitAtIndex("abcde", 10)).toEqual(["abcde", ""]);
	});
	test("correctly handles negative indecies", () => {
		expect(splitAtIndex("abcde", -2)).toEqual(["abcde", ""]);
	});
});

describe("encodeBase64()", () => {
	test("correctly encodes to base64", () => {
		expect(encodeBase64("test test test")).toEqual("dGVzdCB0ZXN0IHRlc3Q=");
	});
});

describe("decodeBase64()", () => {
	test("correctly decodes base64", () => {
		expect(decodeBase64("dGVzdCB0ZXN0IHRlc3Q")).toEqual("test test test");
	});
});
