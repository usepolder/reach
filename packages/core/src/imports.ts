import type { Ast } from './parse';

export interface ImportBinding {
  /** Raw import source, e.g. '@acme/ds', '@acme/ds/Button', './Card'. */
  source: string;
  /** What was bound: a named export, the default export, or a namespace. */
  kind: 'named' | 'default' | 'namespace';
}

/** localName in this file → where it came from. */
export type ImportMap = Map<string, ImportBinding>;

/**
 * Build the file's import map from top-level import declarations. Handles
 * renames (`import { Button as Btn }` maps Btn), default imports, and
 * namespace imports (`import * as DS` maps DS, the root of `<DS.Button>`).
 */
export function buildImportMap(ast: Ast): ImportMap {
  const map: ImportMap = new Map();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const source = node.source.value;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        map.set(spec.local.name, { source, kind: 'named' });
      } else if (spec.type === 'ImportDefaultSpecifier') {
        map.set(spec.local.name, { source, kind: 'default' });
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        map.set(spec.local.name, { source, kind: 'namespace' });
      }
    }
  }
  return map;
}
