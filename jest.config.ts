import type { JestConfigWithTsJest} from 'ts-jest'
import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset().transform

const jestConfig:JestConfigWithTsJest = {
  roots: ['./src'],
  preset: 'ts-jest',
  transform: {
    ...tsJestTransformCfg,
    '^.+\\.jsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  testEnvironment: "node",
  testPathIgnorePatterns: ['\\._\\.test\\.ts[x]?'],
  transformIgnorePatterns: [
    // Non ignorare i file .ohm-bundle.js all'interno di node_modules (se applicabile)
    'node_modules/(?!.*\\.ohm-bundle\\.js)'
  ],
  /*
    transform: {
    ...tsJestTransformCfg,
    // '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  // transform: {
    //   '^.+\\.(js|jsx)$': 'babel-jest', // Assicurati di avere un trasformatore anche per JS se necessario
    //   '^.+\\.(ts|tsx)$': 'ts-jest',
  // },
  transformIgnorePatterns: [
    // Consente a Jest di trasformare i file .ohm-bundle.js ovunque si trovino
    // '/src/ohm/grammar/grammar.ohm-bundle.js$',
    // Se il file è locale nella cartella src, assicurati che non sia ignorato da altre regole
  ],
  */
};
export default jestConfig;