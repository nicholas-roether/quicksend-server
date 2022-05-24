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

function requireEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing environment variable '${name}'!`);
	return value;
}

interface ArrayDiff<T> {
	missing: T[];
	extra: T[];
}

function arrayDiff<T>(array: T[], reference: T[]): ArrayDiff<T> {
	const set = new Set(array);
	const refSet = new Set(reference);

	for (const item of set) if (refSet.delete(item)) set.delete(item);
	for (const item of refSet) set.delete(item);

	return {
		missing: Array.from(refSet),
		extra: Array.from(set)
	};
}

function mapToRecord<K extends string | number | symbol, V>(
	map: Map<K, V>
): Partial<Record<K, V>> {
	const record: Partial<Record<K, V>> = {};
	for (const [key, value] of map.entries()) record[key] = value;
	return record;
}

function recordToMap<K extends string | number | symbol, V>(
	record: Record<K, V>
): Map<K, V> {
	const map = new Map<K, V>();
	for (const key in record) map.set(key, record[key]);
	return map;
}

function mapObject<V, R>(
	obj: Record<string, V>,
	callback: (val: V, key: string) => R
): Record<string, R> {
	const returnObj = {} as Record<string, R>;
	for (const [key, val] of Object.entries(obj))
		returnObj[key] = callback(val, key);
	return returnObj;
}

export {
	collapseWhitespace,
	splitAtIndex,
	encodeBase64,
	decodeBase64,
	includesAll,
	requireEnvVar,
	arrayDiff,
	mapToRecord,
	recordToMap,
	mapObject
};

export type { ArrayDiff };
