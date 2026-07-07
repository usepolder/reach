// Comment upsert, adapted from usepolder/drift's GitHubPlatform: paginate the
// comment list so the marker can't be missed on busy PRs, update the last
// marked comment, and degrade fork PRs (read-only token, 403) to the step
// summary instead of losing the report.
import * as core from '@actions/core';
import type * as github from '@actions/github';
import { REACH_MARKER } from './comment';

type Octokit = ReturnType<typeof github.getOctokit>;

const COMMENTS_PER_PAGE = 100;
const MAX_COMMENT_PAGES = 50;

async function findExistingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<number | null> {
  const mine: number[] = [];
  for (let page = 1; page <= MAX_COMMENT_PAGES; page++) {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: COMMENTS_PER_PAGE,
      page,
    });
    for (const c of comments) {
      if (c.body?.includes(REACH_MARKER)) mine.push(c.id);
    }
    if (comments.length < COMMENTS_PER_PAGE) break;
  }
  return mine.length > 0 ? mine[mine.length - 1] : null;
}

export async function upsertComment(
  octokit: Octokit,
  repoRef: { owner: string; repo: string },
  prNumber: number,
  body: string,
): Promise<void> {
  const { owner, repo } = repoRef;
  try {
    const existingId = await findExistingComment(octokit, owner, repo, prNumber);
    if (existingId !== null) {
      await octokit.rest.issues.updateComment({ owner, repo, comment_id: existingId, body });
    } else {
      await octokit.rest.issues.createComment({ owner, repo, issue_number: prNumber, body });
    }
  } catch (err) {
    // Fork PRs get a read-only token. The report already went to the step
    // summary, so warn instead of failing the whole check.
    if ((err as { status?: number }).status === 403) {
      core.warning(
        'Polder Reach: could not post the PR comment (read-only token, likely a fork PR). ' +
          'The report is in the workflow step summary.',
      );
      return;
    }
    throw err;
  }
}
