// PR comment + step summary markdown. The marker keeps the comment single:
// the upsert finds and updates it instead of posting a new one per push.
import type { ReachReport } from '@usepolder/core';

export const REACH_MARKER = '<!-- polder-reach -->';

function deltaLine(score: number, baseScore: number, baseRef: string | null): string {
  const delta = Math.round((score - baseScore) * 10) / 10;
  const vs = baseRef ? `vs \`${baseRef}\`` : 'vs base';
  if (delta > 0) return `▲ +${delta.toFixed(1)} pts ${vs}`;
  if (delta < 0) return `▼ ${delta.toFixed(1)} pts ${vs}`;
  return `no change ${vs}`;
}

export function renderComment(
  report: ReachReport,
  baseScore: number | null,
  baseRef: string | null,
): string {
  const { counts, leaks } = report;
  const lines: string[] = [REACH_MARKER, '## Polder Reach', ''];

  if (counts.countable === 0) {
    lines.push('No countable JSX instances found in the scanned paths.');
  } else {
    const delta = baseScore !== null ? `   ${deltaLine(report.score, baseScore, baseRef)}` : '';
    lines.push(`**Score: ${report.score.toFixed(1)}%**${delta}`);
    lines.push('');
    lines.push(
      `${counts.dsInstances} of ${counts.countable} countable instances come from the design system.`,
    );
    lines.push('');
    lines.push('| Instances | Count |');
    lines.push('| --- | ---: |');
    lines.push(`| DS components | ${counts.dsInstances} |`);
    lines.push(`| Other components | ${counts.otherComponents} |`);
    lines.push(`| Styled host elements | ${counts.styledHosts} |`);
  }

  lines.push('');
  lines.push(
    leaks.total === 0
      ? '**Leaks:** 0'
      : `**Leaks:** ${leaks.total} (${leaks.hexColors} hex colors, ${leaks.pxValues} px values)`,
  );

  if (counts.filesFailed > 0) {
    lines.push('');
    lines.push(
      `⚠️ ${counts.filesFailed} file(s) could not be parsed and were skipped.`,
    );
  }

  lines.push('');
  lines.push(
    '<sub>[Polder Reach](https://github.com/usepolder/reach) · ' +
      '[how the score works](https://github.com/usepolder/reach#the-metric) · ' +
      'Design Lead OS: coming soon</sub>',
  );

  return lines.join('\n');
}
