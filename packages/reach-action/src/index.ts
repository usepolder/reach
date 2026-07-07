// GitHub Action entrypoint. Thin: load config, scan head, best-effort scan the
// PR base via a temporary worktree, then post one upserted comment + step summary.
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseConfig, scanRepo, type ReachReport } from '@usepolder/core';
import { renderComment } from './comment';
import { scanBaseRef } from './git';
import { upsertComment } from './github';

async function run(): Promise<void> {
  const workdir = path.resolve(core.getInput('working-directory') || '.');
  const configPath = path.join(workdir, '.polder.yml');
  if (!fs.existsSync(configPath)) {
    core.setFailed(
      `Polder Reach: no .polder.yml found in ${workdir}. ` +
        'Create one with component_library: "@your/design-system".',
    );
    return;
  }
  const config = parseConfig(fs.readFileSync(configPath, 'utf8'));

  const report = scanRepo(workdir, config);
  core.info(
    `Polder Reach: score ${report.score.toFixed(1)}% ` +
      `(${report.counts.dsInstances} DS / ${report.counts.countable} countable), ` +
      `${report.leaks.total} leak(s)`,
  );

  const pr = github.context.payload.pull_request;
  let baseReport: ReachReport | null = null;
  if (pr) {
    baseReport = scanBaseRef(workdir, pr.base.sha as string, config, (m) => core.warning(m));
    if (baseReport) {
      core.info(`Polder Reach: base score ${baseReport.score.toFixed(1)}%`);
    }
  }

  core.setOutput('score', report.score);
  core.setOutput('leaks', report.leaks.total);
  if (baseReport) core.setOutput('base-score', baseReport.score);

  const body = renderComment(
    report,
    baseReport?.score ?? null,
    (pr?.base?.ref as string | undefined) ?? null,
  );

  try {
    await core.summary.addRaw(body, true).write();
  } catch {
    // Step summary is best-effort (absent when run outside Actions).
  }

  if (pr) {
    const token = core.getInput('github-token', { required: true });
    await upsertComment(github.getOctokit(token), github.context.repo, pr.number, body);
  } else {
    core.info('Polder Reach: not a pull_request event, skipping the PR comment');
  }

  if (config.reach.failUnder > 0 && report.score < config.reach.failUnder) {
    core.setFailed(
      `Reach score ${report.score.toFixed(1)}% is below fail_under (${config.reach.failUnder}%)`,
    );
  }
}

run().catch((err: Error) => {
  core.setFailed(err.message);
});
