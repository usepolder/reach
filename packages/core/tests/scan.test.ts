// The JSON report is the contract Design Lead OS ingests — every fixture's full
// report is snapshot-tested so any shape or math change is a deliberate diff.
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { scanRepo } from '../src/scan';
import { parseConfig, defaultReachSettings, type ReachConfig } from '../src/config';

const FIXTURES = path.join(__dirname, 'fixtures');

const acmeConfig = (): ReachConfig => ({
  componentLibrary: ['@acme/ds'],
  reach: defaultReachSettings(),
});

describe('scanRepo', () => {
  it('pure-ds fixture → 100% score', () => {
    const report = scanRepo(path.join(FIXTURES, 'pure-ds'), acmeConfig());
    expect(report.score).toBe(100);
    expect(report.counts.dsInstances).toBe(6);
    expect(report.counts.otherComponents).toBe(0);
    expect(report.counts.styledHosts).toBe(0);
    expect(report).toMatchSnapshot();
  });

  it('mixed fixture → score per the denominator ruling', () => {
    const dir = path.join(FIXTURES, 'mixed');
    const config = parseConfig(fs.readFileSync(path.join(dir, '.polder.yml'), 'utf8'));
    const report = scanRepo(dir, config);

    // 6 DS (Banner, Table, Table.Row, Button x2, Tag)
    // 4 other (Hero, LegacyCard, mui Card, mui CardContent)
    // 5 styled hosts (main, div[style], header, h1, div[className+style])
    expect(report.counts.dsInstances).toBe(6);
    expect(report.counts.otherComponents).toBe(4);
    expect(report.counts.styledHosts).toBe(5);
    expect(report.counts.countable).toBe(15);
    expect(report.score).toBe(40);
    expect(report.componentsOnlyScore).toBe(60);
    expect(report.counts.filesFailed).toBe(1);
    expect(report.files.find((f) => f.file === 'src/broken.tsx')?.parseFailed).toBe(true);
    // App.test.tsx excluded via the fixture's .polder.yml
    expect(report.files.some((f) => f.file.includes('.test.'))).toBe(false);
    expect(report).toMatchSnapshot();
  });

  it('no-ds fixture → 0% score', () => {
    const report = scanRepo(path.join(FIXTURES, 'no-ds'), acmeConfig());
    expect(report.score).toBe(0);
    expect(report.counts.countable).toBe(3);
    expect(report).toMatchSnapshot();
  });

  it('score is 0 (not NaN) when nothing is countable', () => {
    const report = scanRepo(path.join(FIXTURES, 'no-ds'), {
      componentLibrary: ['@acme/ds'],
      reach: { include: ['does-not-exist/**'], exclude: [], failUnder: 0 },
    });
    expect(report.score).toBe(0);
    expect(report.counts.countable).toBe(0);
  });
});
