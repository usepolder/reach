// Base-branch scan via a temporary git worktree, per the M3 ruling. Every git
// failure degrades to null (score-only comment) rather than breaking the run,
// matching usepolder/drift's platforms/git.ts philosophy.
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanRepo, type ReachConfig, type ReachReport } from '@usepolder/core';

function git(cwd: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/**
 * Scan the base commit of a PR. Uses the head checkout's config for both sides
 * so the two scores are comparable. Returns null when anything git-related
 * fails (shallow clone without fetch access, missing workdir on base, ...).
 */
export function scanBaseRef(
  workdir: string,
  baseSha: string,
  config: ReachConfig,
  warn: (msg: string) => void,
): ReachReport | null {
  const topOut = git(workdir, ['rev-parse', '--show-toplevel']);
  if (!topOut) {
    warn('Polder Reach: not a git checkout, skipping base comparison');
    return null;
  }
  const repoRoot = topOut.trim();
  const rel = path.relative(repoRoot, workdir);

  // actions/checkout defaults to depth 1; fetch just the base commit if missing.
  if (!git(repoRoot, ['rev-parse', '--verify', '--quiet', `${baseSha}^{commit}`])) {
    if (git(repoRoot, ['fetch', '--depth=1', 'origin', baseSha]) === null) {
      warn(`Polder Reach: could not fetch base commit ${baseSha}, skipping base comparison`);
      return null;
    }
  }

  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-base-'));
  const tmp = path.join(tmpParent, 'worktree');
  try {
    if (git(repoRoot, ['worktree', 'add', '--detach', tmp, baseSha]) === null) {
      warn('Polder Reach: git worktree add failed, skipping base comparison');
      return null;
    }
    const baseDir = rel ? path.join(tmp, rel) : tmp;
    if (!fs.existsSync(baseDir)) {
      warn('Polder Reach: working directory does not exist on the base commit');
      return null;
    }
    return scanRepo(baseDir, config);
  } finally {
    git(repoRoot, ['worktree', 'remove', '--force', tmp]);
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
}
