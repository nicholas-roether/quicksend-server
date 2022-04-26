function collapseWhitespace(str: string) {
	return str.replace(/ +/g, " ");
}

function splitAtIndex(str: string, index: number): [string, string] {
	if (index < 0 || index > str.length) return [str, ""];
	return [str.substring(0, index), str.substring(index + 1)];
}

function encodeBase64(str: string): string {
	const buffer = Buffer.from(str, "utf-8");
	return buffer.toString("base64");
}

function decodeBase64(str: string): string {
	const buffer = Buffer.from(str, "base64");
	return buffer.toString("utf-8");
}

export { collapseWhitespace, splitAtIndex, encodeBase64, decodeBase64 };
