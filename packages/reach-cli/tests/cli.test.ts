import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { scanRepo, parseConfig } from '@usepolder/core';
import * as fs from 'fs';
import { render } from '../src/render';
import { parseArgs, loadConfig } from '../src/cli';

const MIXED = path.join(__dirname, '../../core/tests/fixtures/mixed');

describe('render', () => {
  it('prints the score block for the mixed fixture', () => {
    const config = parseConfig(fs.readFileSync(path.join(MIXED, '.polder.yml'), 'utf8'));
    const out = render(scanRepo(MIXED, config));
    expect(out).toContain('Polder Reach');
    expect(out).toContain('Score: 40.0%');
    expect(out).toContain('(6 DS / 15 countable instances)');
    expect(out).toContain('DS components');
    expect(out).toContain('could not be parsed');
    expect(out).toMatchSnapshot();
  });

  it('says so when nothing is countable', () => {
    const report = scanRepo(MIXED, {
      componentLibrary: ['@acme/ds'],
      reach: { include: ['does-not-exist/**'], exclude: [], failUnder: 0 },
    });
    expect(render(report)).toContain('No countable JSX instances found');
  });
});

describe('parseArgs', () => {
  it('defaults', () => {
    expect(parseArgs([])).toEqual({ dir: '.', json: false });
  });

  it('dir, --json, --library', () => {
    expect(parseArgs(['apps/web', '--json', '--library', '@acme/ds'])).toEqual({
      dir: 'apps/web',
      json: true,
      library: '@acme/ds',
    });
  });

  it('unknown flag throws', () => {
    expect(() => parseArgs(['--nope'])).toThrow('Unknown flag');
  });
});

describe('loadConfig', () => {
  it('reads .polder.yml from the target dir', () => {
    const cfg = loadConfig(MIXED);
    expect(cfg.componentLibrary).toEqual(['@acme/ds']);
  });

  it('--library works with zero config', () => {
    const cfg = loadConfig(path.join(__dirname, '../../core/tests/fixtures/no-ds'), '@acme/ds');
    expect(cfg.componentLibrary).toEqual(['@acme/ds']);
  });

  it('no config and no --library → helpful error', () => {
    expect(() => loadConfig(path.join(__dirname, '../../core/tests/fixtures/pure-ds'))).toThrow(
      'No .polder.yml found',
    );
  });
});
