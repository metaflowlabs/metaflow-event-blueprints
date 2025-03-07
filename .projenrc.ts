import { awscdk } from 'projen';
import { TrailingComma, TypescriptConfigOptions } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { setupHusky } from './projenrc/husky';

const cdkVersion = '2.182.0';

const nodejsVersion = {
  MIN: '18.18.0',
  MAX: '20.x',
} as const;

const tsConfigOptions: TypescriptConfigOptions = {
  compilerOptions: {
    esModuleInterop: true,
  },
};

const commonIgnore = [
  '**/integ.*.snapshot/asset.*/',
  '.DS_Store',
  '.idea',
  '.vscode',
  'cdk.context.json',
  'cdk.out',
  'coverage',
  'docs/data',
  'node_modules/',
];

const devDeps = [
  `@aws-cdk/integ-runner@${cdkVersion}-alpha.0`,
  `@aws-cdk/integ-tests-alpha@${cdkVersion}-alpha.0`,
  '@commitlint/cli@^18.4.3',
  '@commitlint/config-conventional@^18.4.3',
  '@commitlint/cz-commitlint@^18.4.3',
  'cz-conventional-changelog@^3.3.0',
  'husky@^9.1.7',
  'lint-staged@^15.4.3',
  'validate-branch-name@^1.3.2',
];

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Bryan Galvin',
  authorAddress: 'bcgalvin@gmail.com',
  cdkVersion: cdkVersion,
  defaultReleaseBranch: 'main',
  minNodeVersion: nodejsVersion.MIN,
  maxNodeVersion: nodejsVersion.MAX,
  jsiiVersion: '~5.7.0',
  typescriptVersion: '~5.7.0',
  name: 'metaflow-event-blueprints',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/metaflowlabs/metaflow-event-blueprints.git',
  packageManager: NodePackageManager.PNPM,
  devDeps: devDeps,
  prettier: true,
  prettierOptions: {
    settings: {
      printWidth: 120,
      singleQuote: true,
      trailingComma: TrailingComma.ALL,
    },
  },
  eslintOptions: {
    prettier: true,
    dirs: ['src', 'projenrc'],
    ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', 'test/', 'coverage'],
  },
  tsconfig: {
    ...tsConfigOptions,
  },
  gitignore: commonIgnore,
  pullRequestTemplate: false,
  githubOptions: {
    workflows: false,
  },
  release: false,
});

project.package.addDevDeps('eslint@^8');

project.addScripts({
  ['prettier']: 'prettier --write src/**/*.ts test/**/*.ts projenrc/**/*.ts README.md',
  ['prepare']: 'husky || true',
});

project.addFields({
  'lint-staged': {
    'src/**/*.ts': ['prettier --write', 'eslint --fix'],
    'test/**/*.ts': ['prettier --write', 'eslint --fix'],
    'projenrc/**/*.ts': ['prettier --write', 'eslint --fix'],
    '.projenrc.ts': ['prettier --write', 'eslint --fix'],
    'README.md': ['prettier --write'],
  },
});

setupHusky(project);
project.synth();
