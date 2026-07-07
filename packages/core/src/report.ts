// The JSON report is the contract Design Lead OS ingests later. Treat its shape
// as an API: bump SCHEMA_VERSION on any breaking change, snapshot-test per fixture.
import type { Instance } from './instances';

export const SCHEMA_VERSION = 1;

export interface FileCounts {
  file: string;
  ds: number;
  other: number;
  styledHosts: number;
  unstyledHosts: number;
  /** File couldn't be parsed even with errorRecovery — zero counts mean "couldn't look". */
  parseFailed?: true;
}

export interface ReachCounts {
  dsInstances: number;
  otherComponents: number;
  styledHosts: number;
  /** The denominator: ds + other + styled hosts. */
  countable: number;
  /** Transparency only — layout glue, never part of the score. */
  unstyledHosts: number;
  filesScanned: number;
  filesFailed: number;
}

// Leak shape is part of the schema from day one; M2 fills it in.
export interface LeakItem {
  file: string;
  line: number;
  kind: 'hex' | 'px';
  value: string;
}

export interface LeakCounts {
  total: number;
  hexColors: number;
  pxValues: number;
  items: LeakItem[];
}

export interface ReachReport {
  schemaVersion: number;
  tool: 'reach';
  /**
   * The Reach score, 0–100 with one decimal:
   * DS instances / (DS + other components + styled hosts). Not configurable.
   */
  score: number;
  /** DS / (DS + other components), ignoring styled hosts. Transparency only. */
  componentsOnlyScore: number;
  counts: ReachCounts;
  leaks: LeakCounts;
  files: FileCounts[];
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function emptyFileCounts(file: string): FileCounts {
  return { file, ds: 0, other: 0, styledHosts: 0, unstyledHosts: 0 };
}

export function tallyInstances(file: string, instances: Instance[]): FileCounts {
  const counts = emptyFileCounts(file);
  for (const inst of instances) {
    if (inst.kind === 'ds') counts.ds++;
    else if (inst.kind === 'other') counts.other++;
    else if (inst.kind === 'styled-host') counts.styledHosts++;
    else counts.unstyledHosts++;
  }
  return counts;
}

export function buildReport(
  files: FileCounts[],
  filesScanned: number,
  leaks?: LeakCounts,
): ReachReport {
  let ds = 0;
  let other = 0;
  let styledHosts = 0;
  let unstyledHosts = 0;
  let filesFailed = 0;
  for (const f of files) {
    ds += f.ds;
    other += f.other;
    styledHosts += f.styledHosts;
    unstyledHosts += f.unstyledHosts;
    if (f.parseFailed) filesFailed++;
  }
  const countable = ds + other + styledHosts;

  return {
    schemaVersion: SCHEMA_VERSION,
    tool: 'reach',
    score: ratio(ds, countable),
    componentsOnlyScore: ratio(ds, ds + other),
    counts: {
      dsInstances: ds,
      otherComponents: other,
      styledHosts,
      countable,
      unstyledHosts,
      filesScanned,
      filesFailed,
    },
    leaks: leaks ?? { total: 0, hexColors: 0, pxValues: 0, items: [] },
    // Only files that contributed something (or failed to parse) appear —
    // keeps the JSON proportional to the UI surface, not the repo size.
    files: files
      .filter((f) => f.ds + f.other + f.styledHosts + f.unstyledHosts > 0 || f.parseFailed)
      .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0)),
  };
}
