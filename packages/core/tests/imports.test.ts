import { describe, it, expect } from 'vitest';
import { parseSource } from '../src/parse';
import { buildImportMap } from '../src/imports';

function mapOf(code: string) {
  const ast = parseSource(code);
  if (!ast) throw new Error('fixture code failed to parse');
  return buildImportMap(ast);
}

describe('buildImportMap', () => {
  it('named imports', () => {
    const m = mapOf(`import { Button, Card } from '@acme/ds';`);
    expect(m.get('Button')).toEqual({ source: '@acme/ds', kind: 'named', imported: 'Button' });
    expect(m.get('Card')).toEqual({ source: '@acme/ds', kind: 'named', imported: 'Card' });
  });

  it('renamed imports map the local name and keep the exported one', () => {
    const m = mapOf(`import { Button as Btn } from '@acme/ds';`);
    expect(m.get('Btn')).toEqual({ source: '@acme/ds', kind: 'named', imported: 'Button' });
    expect(m.has('Button')).toBe(false);
  });

  it('default imports', () => {
    const m = mapOf(`import Icon from '@acme/ds/Icon';`);
    expect(m.get('Icon')).toEqual({ source: '@acme/ds/Icon', kind: 'default' });
  });

  it('namespace imports', () => {
    const m = mapOf(`import * as DS from '@acme/ds';`);
    expect(m.get('DS')).toEqual({ source: '@acme/ds', kind: 'namespace' });
  });

  it('relative imports keep their raw source', () => {
    const m = mapOf(`import { Card } from './Card';`);
    expect(m.get('Card')).toEqual({ source: './Card', kind: 'named', imported: 'Card' });
  });
});
