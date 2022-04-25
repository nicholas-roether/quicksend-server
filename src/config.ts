import dotenv from "dotenv";
import path from "path";
dotenv.config();
dotenv.config({
	path: path.resolve(process.cwd(), ".env.local"),
	override: true
});

function requireEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing environment variable '${name}'!`);
	return value;
}

export { requireEnvVar };
