import * as fs from 'fs';
import * as path from 'path';
import type { ReachConfig } from './config';
import { parseSource } from './parse';
import { buildImportMap } from './imports';
import { classifyInstances } from './instances';
import { findLeaks, buildLeakCounts } from './leaks';
import { walk, SOURCE_EXTENSIONS, STYLE_EXTENSIONS } from './walk';
import {
  buildReport,
  emptyFileCounts,
  tallyInstances,
  type FileCounts,
  type LeakItem,
  type ReachReport,
} from './report';

function read(cwd: string, file: string): string | null {
  try {
    return fs.readFileSync(path.join(cwd, file), 'utf8');
  } catch {
    return null;
  }
}

/** Scan a repo and produce the full Reach report. */
export function scanRepo(cwd: string, config: ReachConfig): ReachReport {
  const { include, exclude } = config.reach;
  const sourceFiles = walk(cwd, include, exclude, SOURCE_EXTENSIONS);
  const leaks: LeakItem[] = [];

  const fileCounts: FileCounts[] = sourceFiles.map((file) => {
    const content = read(cwd, file);
    if (content === null) return emptyFileCounts(file);

    // Leaks are regex-based and don't need a parse — even unparseable files
    // get scanned for hex/px.
    leaks.push(...findLeaks(file, content));

    const ast = parseSource(content);
    if (!ast) {
      const failed = emptyFileCounts(file);
      failed.parseFailed = true;
      return failed;
    }
    const importMap = buildImportMap(ast);
    const instances = classifyInstances(ast, importMap, config.componentLibrary);
    return tallyInstances(file, instances);
  });

  // Stylesheets carry leaks but no JSX instances.
  for (const file of walk(cwd, include, exclude, STYLE_EXTENSIONS)) {
    const content = read(cwd, file);
    if (content !== null) leaks.push(...findLeaks(file, content));
  }

  return buildReport(fileCounts, sourceFiles.length, buildLeakCounts(leaks));
}
