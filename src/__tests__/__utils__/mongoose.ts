import "src/config";
import mongoose from "mongoose";
import { requireEnvVar } from "src/utils";

function createMongooseConnection() {
	before(async () => {
		await mongoose.connect(requireEnvVar("TEST_DB_URI"));
		await mongoose.connection.db.dropDatabase();
	});

	after(async () => {
		await mongoose.disconnect();
	});

	afterEach(async function () {
		this.timeout(3000);
		await mongoose.connection.db.dropDatabase();
	});
}

export { createMongooseConnection };
