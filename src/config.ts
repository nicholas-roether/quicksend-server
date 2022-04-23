import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["PORT"];

for (const envVar of requiredEnvVars)
	if (!process.env[envVar])
		throw new Error(`Missing environment variable '${envVar}'!`);
