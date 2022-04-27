import crypto from "crypto";

function generateTestKeys() {
	return crypto.generateKeyPairSync("rsa", {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: "spki",
			format: "pem"
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem"
		}
	});
}

export { generateTestKeys };
