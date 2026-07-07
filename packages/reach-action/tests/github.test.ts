import { describe, it, expect, vi } from 'vitest';
import { upsertComment } from '../src/github';
import { REACH_MARKER } from '../src/comment';

type AnyFn = ReturnType<typeof vi.fn>;

function fakeOctokit(comments: Array<{ id: number; body: string }>) {
  const listComments: AnyFn = vi.fn(async ({ page }: { page: number }) => ({
    data: page === 1 ? comments : [],
  }));
  const updateComment: AnyFn = vi.fn(async () => ({}));
  const createComment: AnyFn = vi.fn(async () => ({}));
  const octokit = { rest: { issues: { listComments, updateComment, createComment } } };
  return { octokit, listComments, updateComment, createComment };
}

const repoRef = { owner: 'usepolder', repo: 'reach' };

describe('upsertComment', () => {
  it('creates when no marked comment exists', async () => {
    const { octokit, createComment, updateComment } = fakeOctokit([
      { id: 1, body: 'unrelated' },
    ]);
    await upsertComment(octokit as never, repoRef, 7, 'new body');
    expect(createComment).toHaveBeenCalledOnce();
    expect(updateComment).not.toHaveBeenCalled();
  });

  it('updates the last marked comment instead of posting a duplicate', async () => {
    const { octokit, createComment, updateComment } = fakeOctokit([
      { id: 1, body: `${REACH_MARKER}\nold` },
      { id: 2, body: 'unrelated' },
      { id: 3, body: `${REACH_MARKER}\nolder duplicate` },
    ]);
    await upsertComment(octokit as never, repoRef, 7, 'updated body');
    expect(updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 3, body: 'updated body' }),
    );
    expect(createComment).not.toHaveBeenCalled();
  });

  it('swallows 403 (fork PR read-only token) with a warning', async () => {
    const { octokit, listComments } = fakeOctokit([]);
    listComments.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));
    await expect(upsertComment(octokit as never, repoRef, 7, 'body')).resolves.toBeUndefined();
  });

  it('rethrows non-403 errors', async () => {
    const { octokit, listComments } = fakeOctokit([]);
    listComments.mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }));
    await expect(upsertComment(octokit as never, repoRef, 7, 'body')).rejects.toThrow('boom');
  });
});
