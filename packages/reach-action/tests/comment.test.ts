import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, scanRepo } from '@usepolder/core';
import { renderComment, REACH_MARKER } from '../src/comment';

const MIXED = path.join(__dirname, '../../core/tests/fixtures/mixed');

function mixedReport() {
  const config = parseConfig(fs.readFileSync(path.join(MIXED, '.polder.yml'), 'utf8'));
  return scanRepo(MIXED, config);
}

describe('renderComment', () => {
  it('contains the marker, score, table, leaks, and parse warning', () => {
    const body = renderComment(mixedReport(), null, null);
    expect(body).toContain(REACH_MARKER);
    expect(body).toContain('**Score: 40.0%**');
    expect(body).toContain('| DS components | 6 |');
    expect(body).toContain('**Leaks:** 6 (3 hex colors, 3 px values)');
    expect(body).toContain('could not be parsed');
    expect(body).toContain('Design Lead OS');
    expect(body).toMatchSnapshot();
  });

  it('shows an upward delta vs the base branch', () => {
    const body = renderComment(mixedReport(), 38.5, 'main');
    expect(body).toContain('▲ +1.5 pts vs `main`');
  });

  it('shows a downward delta', () => {
    const body = renderComment(mixedReport(), 45, 'main');
    expect(body).toContain('▼ -5.0 pts vs `main`');
  });

  it('shows no-change wording when scores match', () => {
    const body = renderComment(mixedReport(), 40, 'main');
    expect(body).toContain('no change vs `main`');
  });

  it('omits the delta when there is no base score', () => {
    const body = renderComment(mixedReport(), null, 'main');
    expect(body).not.toContain('pts vs');
  });
});
