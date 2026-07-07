import pc from 'picocolors';
import type { ReachReport } from '@usepolder/core';

function scoreColor(score: number): (s: string) => string {
  if (score >= 80) return pc.green;
  if (score >= 50) return pc.yellow;
  return pc.red;
}

/** Terminal report. picocolors no-ops when stdout isn't a TTY. */
export function render(report: ReachReport): string {
  const { counts } = report;
  const lines: string[] = [];

  lines.push(pc.bold('Polder Reach'));

  if (counts.countable === 0) {
    lines.push('No countable JSX instances found. Is this a React repo?');
  } else {
    const color = scoreColor(report.score);
    lines.push(
      `Score: ${color(pc.bold(`${report.score.toFixed(1)}%`))}   ` +
        pc.dim(`(${counts.dsInstances} DS / ${counts.countable} countable instances)`),
    );
    const width = String(counts.countable).length;
    const row = (label: string, n: number) =>
      `  ${label.padEnd(22)}${String(n).padStart(width)}`;
    lines.push(row('DS components', counts.dsInstances));
    lines.push(row('Other components', counts.otherComponents));
    lines.push(row('Styled host elements', counts.styledHosts));
  }

  const { leaks } = report;
  if (leaks.total === 0) {
    lines.push(`Leaks: ${pc.green('0')}`);
  } else {
    lines.push(
      `Leaks: ${pc.yellow(pc.bold(String(leaks.total)))}   ` +
        pc.dim(`(${leaks.hexColors} hex colors, ${leaks.pxValues} px values)`),
    );
    const perFile = new Map<string, number>();
    for (const item of leaks.items) {
      perFile.set(item.file, (perFile.get(item.file) ?? 0) + 1);
    }
    const offenders = [...perFile.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, 3)
      .map(([file, n]) => `${file} (${n})`);
    lines.push(pc.dim(`  Top offenders: ${offenders.join(', ')}`));
  }

  lines.push(pc.dim(`${counts.filesScanned} files scanned`));
  if (counts.filesFailed > 0) {
    lines.push(
      pc.yellow(`${counts.filesFailed} file(s) could not be parsed and were skipped`),
    );
  }

  return lines.join('\n');
}
