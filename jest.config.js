/* eslint-disable no-undef */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ["**/__tests__/**"],
	testPathIgnorePatterns: ["/__utils__/"],
	moduleDirectories: ["node_modules", "src"]
};
