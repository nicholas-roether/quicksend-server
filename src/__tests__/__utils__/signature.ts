import crypto from "crypto";
import { Device } from "src/db/schemas/device";
import supertest from "supertest";

type Signer = (req: supertest.Test) => supertest.Test;

function createSigner(target: string, device: Device, key: string): Signer {
	return (req) => {
		const date = new Date();
		const signatureStr = `(request-target): ${target}\ndate: ${date.toUTCString()}\n`;
		const signature = crypto
			.sign(null, Buffer.from(signatureStr), key)
			.toString("base64");
		const authHeader = `Signature keyId="${device._id.toHexString()}",signature="${signature}",headers="(request-target) date"`;

		return req.set("Date", date.toUTCString()).set("Authorization", authHeader);
	};
}

export { createSigner };
export type { Signer };
