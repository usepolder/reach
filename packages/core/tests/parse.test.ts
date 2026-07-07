import { describe, it, expect } from 'vitest';
import { parseSource } from '../src/parse';

describe('parseSource', () => {
  it('parses TSX', () => {
    const ast = parseSource('export const A = () => <div className="x" />;');
    expect(ast).not.toBeNull();
  });

  it('recovers from minor syntax errors (errorRecovery)', () => {
    // Reserved word as identifier — babel records the error and keeps parsing.
    const ast = parseSource('const enum1 = 1; let public = 2;\n');
    expect(ast).not.toBeNull();
    expect(ast!.errors.length).toBeGreaterThan(0);
  });

  it('returns null for unparseable content instead of throwing', () => {
    expect(parseSource('@@@ not source ###')).toBeNull();
  });
});
