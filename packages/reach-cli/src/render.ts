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

  lines.push(pc.dim(`${counts.filesScanned} files scanned`));
  if (counts.filesFailed > 0) {
    lines.push(
      pc.yellow(`${counts.filesFailed} file(s) could not be parsed and were skipped`),
    );
  }

  return lines.join('\n');
}
