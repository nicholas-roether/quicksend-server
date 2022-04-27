function collapseWhitespace(str: string) {
	return str.replace(/ +/g, " ").replace(/^ +/, "").replace(/ +$/, "");
}

function splitAtIndex(str: string, index: number): [string, string] {
	if (index < 0 || index > str.length) return [str, ""];
	return [str.substring(0, index), str.substring(index + 1)];
}

function encodeBase64(str: string): string {
	if (!str) return str;
	const buffer = Buffer.from(str, "utf-8");
	return buffer.toString("base64");
}

function decodeBase64(str: string): string {
	if (!str) return str;
	const buffer = Buffer.from(str, "base64");
	return buffer.toString("utf-8");
}

function includesAll<T>(arr: T[], ...values: T[]): boolean {
	const notIncluded = new Set<T>();
	values.forEach((val) => notIncluded.add(val));
	arr.forEach((item) => notIncluded.delete(item));
	return notIncluded.size == 0;
}

export {
	collapseWhitespace,
	splitAtIndex,
	encodeBase64,
	decodeBase64,
	includesAll
};
