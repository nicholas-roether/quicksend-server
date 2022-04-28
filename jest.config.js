/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require("./tsconfig.json");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ["**/__tests__/**"],
	testPathIgnorePatterns: ["/__utils__/"],
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/"})
};
