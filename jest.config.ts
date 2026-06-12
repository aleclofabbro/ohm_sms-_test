import type { JestConfigWithTsJest} from 'ts-jest'
import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset().transform

const jestConfig:JestConfigWithTsJest = {
  roots: ['./src'],
  preset: 'ts-jest',
  transform: {
    ...tsJestTransformCfg,
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  testEnvironment: "node",
  testPathIgnorePatterns: ['\\._\\.test\\.ts[x]?']
};
export default jestConfig;