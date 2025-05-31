import { execSync } from 'child_process';

export function getCurrentBranch(): string {
  return execSync(
    'git rev-parse --abbrev-ref HEAD',
    { cwd: process.cwd(), encoding: 'utf-8' }
  ).trim();
}

export function getSha(ref: string = 'HEAD'): string {
  return execSync(
    `git rev-parse ${ref}`,
    { cwd: process.cwd(), encoding: 'utf-8' }
  ).trim();
}

export function getDiff(
  startSha: string,
  endSha: string
): { stat: string; patches: string } {
  const stat = execSync(
    `git diff --stat ${startSha}..${endSha}`,
    { cwd: process.cwd(), encoding: 'utf-8' }
  );
  const patches = execSync(
    `git diff ${startSha}..${endSha}`,
    { cwd: process.cwd(), encoding: 'utf-8' }
  );
  return { stat, patches };
}

export function countLines(
  startSha: string,
  endSha: string
): number {
  const out = execSync(
    `git diff --numstat ${startSha}..${endSha}`,
    { cwd: process.cwd(), encoding: 'utf-8' }
  );
  return out
    .split('\n')
    .filter(line => line)
    .map(line => {
      const [add, del] = line.split('\t').map(n => parseInt(n, 10));
      return add + del;
    })
    .reduce((sum, n) => sum + n, 0);
}