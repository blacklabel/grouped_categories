module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/ts'],
	testMatch: ['**/*.test.ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'ts/**/*.ts',
		'!ts/**/*.test.ts',
		'!ts/**/*.d.ts'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	setupFilesAfterEnv: ['<rootDir>/ts/test-setup.ts'],
	moduleNameMapping: {
		'^highcharts$': '<rootDir>/node_modules/highcharts/highcharts.js'
	}
};
