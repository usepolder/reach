#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import {
  defaultReachSettings,
  parseConfig,
  scanRepo,
  type ReachConfig,
} from '@usepolder/core';
import { render } from './render';

interface CliArgs {
  dir: string;
  json: boolean;
  library?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dir: '.', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') {
      args.json = true;
    } else if (a === '--library') {
      const value = argv[++i];
      if (!value) throw new Error('--library requires a package name');
      args.library = value;
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      args.dir = a;
    }
  }
  return args;
}

export function loadConfig(dir: string, libraryOverride?: string): ReachConfig {
  const configPath = path.join(dir, '.polder.yml');
  let config: ReachConfig | null = null;
  if (fs.existsSync(configPath)) {
    config = parseConfig(fs.readFileSync(configPath, 'utf8'));
  }
  if (libraryOverride) {
    return {
      componentLibrary: [libraryOverride],
      reach: config?.reach ?? defaultReachSettings(),
    };
  }
  if (!config) {
    throw new Error(
      'No .polder.yml found. Create one with `component_library: "@your/design-system"`, ' +
        'or pass --library "@your/design-system".',
    );
  }
  return config;
}

export function main(argv: string[]): number {
  let args: CliArgs;
  let config: ReachConfig;
  try {
    args = parseArgs(argv);
    config = loadConfig(path.resolve(args.dir), args.library);
  } catch (err) {
    console.error((err as Error).message);
    return 2;
  }

  const report = scanRepo(path.resolve(args.dir), config);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(render(report));
  }

  // fail_under gates CI; it never changes the score.
  if (config.reach.failUnder > 0 && report.score < config.reach.failUnder) {
    console.error(
      `Reach score ${report.score.toFixed(1)}% is below fail_under (${config.reach.failUnder}%)`,
    );
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
