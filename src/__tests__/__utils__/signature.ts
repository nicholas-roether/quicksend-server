import crypto from "crypto";
import { Device } from "src/db/schemas/device";

function createTestSignatureGenerator(
	target: string
): (key: string, date: Date, device: Device) => string {
	return (key, date, device) => {
		const signatureStr = `(request-target): ${target}\ndate: ${date.toUTCString()}\n`;
		const signature = crypto
			.sign(null, Buffer.from(signatureStr), key)
			.toString("base64");
		const authHeader = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;
		return authHeader;
	};
}

export { createTestSignatureGenerator };
