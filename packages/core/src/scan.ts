import * as fs from 'fs';
import * as path from 'path';
import type { ReachConfig } from './config';
import { parseSource } from './parse';
import { buildImportMap } from './imports';
import { classifyInstances } from './instances';
import { walk, SOURCE_EXTENSIONS } from './walk';
import { buildReport, emptyFileCounts, tallyInstances, type ReachReport } from './report';

/** Scan a repo and produce the full Reach report. */
export function scanRepo(cwd: string, config: ReachConfig): ReachReport {
  const files = walk(cwd, config.reach.include, config.reach.exclude, SOURCE_EXTENSIONS);
  const fileCounts = files.map((file) => {
    let content: string;
    try {
      content = fs.readFileSync(path.join(cwd, file), 'utf8');
    } catch {
      return emptyFileCounts(file);
    }
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
  return buildReport(fileCounts, files.length);
}
