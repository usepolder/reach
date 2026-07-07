import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfig, scanRepo, type ReachReport } from '@usepolder/core';
import { badgeColor, badgeJson, badgeSvg } from '../src/badge';

const MIXED = path.join(__dirname, '../../core/tests/fixtures/mixed');

function mixedReport(): ReachReport {
  const config = parseConfig(fs.readFileSync(path.join(MIXED, '.polder.yml'), 'utf8'));
  return scanRepo(MIXED, config);
}

function emptyReport(): ReachReport {
  return scanRepo(MIXED, {
    componentLibrary: ['@acme/ds'],
    reach: { include: ['does-not-exist/**'], exclude: [], failUnder: 0 },
  });
}

describe('badgeColor', () => {
  it('maps score bands to shields colors', () => {
    expect(badgeColor(92).name).toBe('brightgreen');
    expect(badgeColor(80).name).toBe('brightgreen');
    expect(badgeColor(65).name).toBe('green');
    expect(badgeColor(40).name).toBe('yellow');
    expect(badgeColor(25).name).toBe('orange');
    expect(badgeColor(10).name).toBe('red');
  });
});

describe('badgeJson', () => {
  it('emits the shields endpoint schema', () => {
    expect(JSON.parse(badgeJson(mixedReport()))).toEqual({
      schemaVersion: 1,
      label: 'reach',
      message: '40.0%',
      color: 'yellow',
    });
  });

  it('shows n/a in lightgrey when nothing is countable', () => {
    expect(JSON.parse(badgeJson(emptyReport()))).toMatchObject({
      message: 'n/a',
      color: 'lightgrey',
    });
  });
});

describe('badgeSvg', () => {
  it('renders the score with the band color', () => {
    const svg = badgeSvg(mixedReport());
    expect(svg).toContain('>40.0%</text>');
    expect(svg).toContain('#dfb317');
    expect(svg).toContain('aria-label="reach: 40.0%"');
    expect(svg).toMatchSnapshot();
  });
});
