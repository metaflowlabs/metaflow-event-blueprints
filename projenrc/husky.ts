import { Project, TextFile } from 'projen';
import { PROJEN_MARKER } from 'projen/lib/common';

export const setupHusky = (rootProject: Project) => {
  // commit-msg hook
  const commitMsg = new TextFile(rootProject, '.husky/commit-msg', {
    marker: true,
  });
  commitMsg.addLine(`# ${PROJEN_MARKER} -- see projenrc/husky.ts`);
  commitMsg.addLine('# commit-msg hook file');
  commitMsg.addLine('pnpm exec commitlint --edit $1');
  commitMsg.addLine('');

  // pre-commit hook
  const preCommit = new TextFile(rootProject, '.husky/pre-commit', {
    marker: true,
  });
  preCommit.addLine(`# ${PROJEN_MARKER} -- see projenrc/husky.ts`);
  preCommit.addLine('# pre-commit hook file');
  preCommit.addLine(
    "pnpm exec validate-branch-name -r '^(main|release){1}$|^(feat|fix|hotfix|infra|release|refactor|chore|docs)/.+$'",
  );
  preCommit.addLine('pnpm exec lint-staged');
  preCommit.addLine('');

  return rootProject;
};
