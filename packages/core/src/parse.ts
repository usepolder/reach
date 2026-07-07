// Lifted from usepolder/drift src/parser.ts (v1.1.2). Drift keeps its own copy
// until it migrates onto @usepolder/core in a later pass.
import { parse, type ParserOptions } from '@babel/parser';

export const BABEL_OPTIONS: ParserOptions = {
  plugins: ['typescript', 'jsx'],
  sourceType: 'module',
  errorRecovery: true,
};

export type Ast = ReturnType<typeof parse>;

/** Parse once; null when @babel/parser can't parse even with errorRecovery. */
export function parseSource(fileContent: string): Ast | null {
  try {
    return parse(fileContent, BABEL_OPTIONS);
  } catch {
    return null;
  }
}
