// Zero-infra badge, two modes from the same run:
//  - reach-badge.json: shields.io endpoint schema; public repos embed
//    https://img.shields.io/endpoint?url=<raw URL to this file>
//  - reach-badge.svg: committed static badge; private repos embed it with a
//    relative image path since shields.io can't fetch their raw files.
import type { ReachReport } from '@usepolder/core';

export const BADGE_DIR = '.polder';
export const BADGE_JSON = 'reach-badge.json';
export const BADGE_SVG = 'reach-badge.svg';

// shields.io color names and their hex values (for the static SVG).
const BANDS: Array<{ min: number; name: string; hex: string }> = [
  { min: 80, name: 'brightgreen', hex: '#4c1' },
  { min: 60, name: 'green', hex: '#97ca00' },
  { min: 40, name: 'yellow', hex: '#dfb317' },
  { min: 20, name: 'orange', hex: '#fe7d37' },
  { min: 0, name: 'red', hex: '#e05d44' },
];

export function badgeColor(score: number): { name: string; hex: string } {
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
  return { name: band.name, hex: band.hex };
}

function message(report: ReachReport): string {
  return report.counts.countable === 0 ? 'n/a' : `${report.score.toFixed(1)}%`;
}

export function badgeJson(report: ReachReport): string {
  const noData = report.counts.countable === 0;
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      label: 'reach',
      message: message(report),
      color: noData ? 'lightgrey' : badgeColor(report.score).name,
    },
    null,
    2,
  )}\n`;
}

// Approximate Verdana 11px text width, the same ballpark shields.io uses.
function textWidth(text: string): number {
  return Math.round(text.length * 6.5) + 10;
}

export function badgeSvg(report: ReachReport): string {
  const label = 'reach';
  const value = message(report);
  const hex = report.counts.countable === 0 ? '#9f9f9f' : badgeColor(report.score).hex;
  const lw = textWidth(label);
  const vw = textWidth(value);
  const w = lw + vw;
  const font = 'font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"';
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">`,
    `  <title>${label}: ${value}</title>`,
    `  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>`,
    `  <g clip-path="url(#r)">`,
    `    <rect width="${lw}" height="20" fill="#555"/>`,
    `    <rect x="${lw}" width="${vw}" height="20" fill="${hex}"/>`,
    `  </g>`,
    `  <g fill="#fff" text-anchor="middle" ${font}>`,
    `    <text x="${lw / 2}" y="14">${label}</text>`,
    `    <text x="${lw + vw / 2}" y="14">${value}</text>`,
    `  </g>`,
    `</svg>`,
    '',
  ].join('\n');
}
