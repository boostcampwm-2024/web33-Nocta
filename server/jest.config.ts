import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  preset: "@shelf/jest-mongodb",
  watchPathIgnorePatterns: ["globalConfig"],
  transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)", "/node_modules/(?!@noctaCrdt)"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@noctaCrdt$": "<rootDir>/../@noctaCrdt/dist/Crdt.js",
    "^@noctaCrdt/(.*)$": "<rootDir>/../@noctaCrdt/dist/$1.js",
    "^nanoid$": require.resolve("nanoid"),
  },
};

export default config;
