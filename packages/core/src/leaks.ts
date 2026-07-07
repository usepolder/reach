// Leak detection, v1: regex-based, no token-awareness. Token source files are
// expected to be excluded via `reach.exclude` globs. Works on raw text, so
// files the parser can't handle still get scanned.
import type { LeakItem, LeakCounts } from './report';

// #rgb, #rgba, #rrggbb, #rrggbbaa — and nothing else (no 5/7/9+ digit runs).
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-fA-F])/g;

// A px value: 12px, 1.5px, .5px. The lookarounds keep it out of identifiers.
const PX_RE = /(?<![\w.])(\d*\.?\d+)px(?![a-zA-Z0-9_])/g;

// String literals in TS/TSX source — px only counts inside these (inline style
// props, style object values, styled-components templates), not in bare code.
const STRING_RE = /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;

const STYLE_FILE_RE = /\.(css|scss)$/;

function lineStarts(content: string): number[] {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function offsetToLine(starts: number[], offset: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1; // 1-based
}

interface RawLeak {
  offset: number;
  kind: 'hex' | 'px';
  value: string;
}

function collectHex(content: string, out: RawLeak[]): void {
  HEX_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HEX_RE.exec(content)) !== null) {
    out.push({ offset: m.index, kind: 'hex', value: m[0] });
  }
}

function collectPx(text: string, baseOffset: number, out: RawLeak[]): void {
  PX_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PX_RE.exec(text)) !== null) {
    if (parseFloat(m[1]) === 0) continue; // 0px is not a hardcoded size
    out.push({ offset: baseOffset + m.index, kind: 'px', value: `${m[1]}px` });
  }
}

/** Find hex/px leaks in one file. `file` decides the scan mode by extension. */
export function findLeaks(file: string, content: string): LeakItem[] {
  const raw: RawLeak[] = [];
  collectHex(content, raw);

  if (STYLE_FILE_RE.test(file)) {
    // Every px value in a stylesheet is a hardcoded size.
    collectPx(content, 0, raw);
  } else {
    // In TS/TSX, px only counts inside string/template literals.
    STRING_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = STRING_RE.exec(content)) !== null) {
      collectPx(m[0], m.index, raw);
    }
  }

  raw.sort((a, b) => a.offset - b.offset);
  const starts = lineStarts(content);
  return raw.map(({ offset, kind, value }) => ({
    file,
    line: offsetToLine(starts, offset),
    kind,
    value,
  }));
}

export function buildLeakCounts(items: LeakItem[]): LeakCounts {
  let hexColors = 0;
  let pxValues = 0;
  for (const item of items) {
    if (item.kind === 'hex') hexColors++;
    else pxValues++;
  }
  return { total: items.length, hexColors, pxValues, items };
}
