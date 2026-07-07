import { describe, it, expect } from 'vitest';
import { findLeaks, buildLeakCounts } from '../src/leaks';

describe('findLeaks — hex colors', () => {
  it('matches #rgb, #rgba, #rrggbb, #rrggbbaa', () => {
    const items = findLeaks('a.ts', `const c = ['#abc', '#abcd', '#aabbcc', '#aabbccdd'];`);
    expect(items.map((i) => i.value)).toEqual(['#abc', '#abcd', '#aabbcc', '#aabbccdd']);
    expect(items.every((i) => i.kind === 'hex')).toBe(true);
  });

  it('rejects 5- and 7-digit runs and non-hex ids', () => {
    const items = findLeaks('a.css', `#12345 {} #1234567 { } #header { color: red; }`);
    expect(items).toEqual([]);
  });

  it('reports 1-based lines', () => {
    const items = findLeaks('a.ts', `const a = 1;\nconst b = '#ff0000';\n`);
    expect(items).toEqual([{ file: 'a.ts', line: 2, kind: 'hex', value: '#ff0000' }]);
  });

  it('case-insensitive hex digits', () => {
    expect(findLeaks('a.ts', `'#FF00aa'`)[0].value).toBe('#FF00aa');
  });
});

describe('findLeaks — px in ts/tsx (string literals only)', () => {
  it('finds px inside quoted style values', () => {
    const items = findLeaks('a.tsx', `<div style={{ padding: '16px' }} />;`);
    expect(items).toEqual([{ file: 'a.tsx', line: 1, kind: 'px', value: '16px' }]);
  });

  it('finds px inside template literals (styled-components), with correct line', () => {
    const code = 'const Wrap = styled.div`\n  padding: 4px;\n`;';
    expect(findLeaks('a.ts', code)).toEqual([
      { file: 'a.ts', line: 2, kind: 'px', value: '4px' },
    ]);
  });

  it('ignores px outside strings (comments, identifiers)', () => {
    const code = `// use 16px here\nconst px16 = compute();\n`;
    expect(findLeaks('a.ts', code)).toEqual([]);
  });

  it('ignores 0px and utility-class fragments like px-4', () => {
    const code = `const a = '0px'; const b = 'px-4 mt-2';`;
    expect(findLeaks('a.ts', code)).toEqual([]);
  });

  it('counts fractional px', () => {
    expect(findLeaks('a.ts', `'0.5px'`)[0].value).toBe('0.5px');
  });
});

describe('findLeaks — css/scss (whole file)', () => {
  it('finds bare px values and hex, skips 0px', () => {
    const css = `.x {\n  color: #ff8800;\n  padding: 12px;\n  margin: 0px;\n}\n`;
    expect(findLeaks('a.css', css)).toEqual([
      { file: 'a.css', line: 2, kind: 'hex', value: '#ff8800' },
      { file: 'a.css', line: 3, kind: 'px', value: '12px' },
    ]);
  });
});

describe('buildLeakCounts', () => {
  it('tallies by kind', () => {
    const items = findLeaks('a.css', `.x { border: 1px solid #00ff0080; }`);
    const counts = buildLeakCounts(items);
    expect(counts).toMatchObject({ total: 2, hexColors: 1, pxValues: 1 });
    expect(counts.items).toHaveLength(2);
  });
});
