import { describe, it, expect } from 'vitest';
import { parseSource } from '../src/parse';
import { buildImportMap } from '../src/imports';
import { classifyInstances, type Instance } from '../src/instances';

const DS = ['@acme/ds'];

function classify(code: string, dsPackages = DS): Instance[] {
  const ast = parseSource(code);
  if (!ast) throw new Error('fixture code failed to parse');
  return classifyInstances(ast, buildImportMap(ast), dsPackages);
}

function kinds(instances: Instance[]): Record<string, string> {
  return Object.fromEntries(instances.map((i) => [i.element, i.kind]));
}

describe('classifyInstances — DS instances', () => {
  it('named import from the DS package', () => {
    const [inst] = classify(`import { Button } from '@acme/ds';\nexport const A = () => <Button />;`);
    expect(inst.kind).toBe('ds');
    expect(inst.dsPackage).toBe('@acme/ds');
  });

  it('renamed import resolves via the local name', () => {
    const [inst] = classify(`import { Button as Btn } from '@acme/ds';\nexport const A = () => <Btn />;`);
    expect(inst.kind).toBe('ds');
    expect(inst.element).toBe('Btn');
  });

  it('default import from a subpath counts for the package', () => {
    const [inst] = classify(`import Icon from '@acme/ds/Icon';\nexport const A = () => <Icon />;`);
    expect(inst.kind).toBe('ds');
    expect(inst.dsPackage).toBe('@acme/ds');
  });

  it('member expression resolves to its root', () => {
    const [inst] = classify(`import { Table } from '@acme/ds';\nexport const A = () => <Table.Row />;`);
    expect(inst.kind).toBe('ds');
    expect(inst.element).toBe('Table.Row');
  });

  it('namespace import member resolves to the namespace root', () => {
    const [inst] = classify(`import * as DS from '@acme/ds';\nexport const A = () => <DS.Button />;`);
    expect(inst.kind).toBe('ds');
  });

  it('a similarly-prefixed package is NOT a subpath match', () => {
    const [inst] = classify(`import { Button } from '@acme/ds-icons';\nexport const A = () => <Button />;`);
    expect(inst.kind).toBe('other');
  });
});

describe('classifyInstances — other components', () => {
  it('import from another library', () => {
    const [inst] = classify(`import { Button } from '@mui/material';\nexport const A = () => <Button />;`);
    expect(inst.kind).toBe('other');
  });

  it('relative import (local component)', () => {
    const [inst] = classify(`import { Card } from './Card';\nexport const A = () => <Card />;`);
    expect(inst.kind).toBe('other');
  });

  it('component defined in the same file (no import at all)', () => {
    const code = `const Local = () => null;\nexport const A = () => <Local />;`;
    expect(classify(code)[0].kind).toBe('other');
  });

  it('member expression with non-DS root (e.g. framer-motion)', () => {
    const [inst] = classify(`import { motion } from 'framer-motion';\nexport const A = () => <motion.div />;`);
    expect(inst.kind).toBe('other');
    expect(inst.element).toBe('motion.div');
  });
});

describe('classifyInstances — host elements', () => {
  it('className → styled host', () => {
    expect(kinds(classify(`export const A = () => <div className="x" />;`))).toEqual({
      div: 'styled-host',
    });
  });

  it('style → styled host', () => {
    expect(kinds(classify(`export const A = () => <div style={{ padding: 4 }} />;`))).toEqual({
      div: 'styled-host',
    });
  });

  it('no styling attributes → unstyled host (excluded from the score)', () => {
    expect(kinds(classify(`export const A = () => <div id="x"><span /></div>;`))).toEqual({
      div: 'unstyled-host',
      span: 'unstyled-host',
    });
  });
});

describe('classifyInstances — exclusions', () => {
  it('fragments produce no instances', () => {
    const code = [
      `import React, { Fragment } from 'react';`,
      `export const A = () => <>{null}</>;`,
      `export const B = () => <Fragment>{null}</Fragment>;`,
      `export const C = () => <React.Fragment>{null}</React.Fragment>;`,
    ].join('\n');
    expect(classify(code)).toEqual([]);
  });
});

describe('classifyInstances — nesting', () => {
  it('finds instances nested inside expressions and callbacks', () => {
    const code = [
      `import { Tag } from '@acme/ds';`,
      `export const A = ({ items }: { items: string[] }) => (`,
      `  <ul>{items.map((i) => (<li key={i}><Tag>{i}</Tag></li>))}</ul>`,
      `);`,
    ].join('\n');
    const result = kinds(classify(code));
    expect(result).toEqual({ ul: 'unstyled-host', li: 'unstyled-host', Tag: 'ds' });
  });

  it('records 1-based line numbers', () => {
    const code = `import { Button } from '@acme/ds';\nexport const A = () =>\n  <Button />;`;
    expect(classify(code)[0].line).toBe(3);
  });
});

describe('classifyInstances — component identity', () => {
  const componentOf = (code: string) => classify(code).map((i) => i.component);

  it('a named import is identified by its exported name', () => {
    expect(componentOf(`import { Button } from '@acme/ds';\nconst A = () => <Button />;`)).toEqual(['Button']);
  });

  it('a renamed import resolves to the exported name, not the alias', () => {
    expect(componentOf(`import { Button as Btn } from '@acme/ds';\nconst A = () => <Btn />;`)).toEqual(['Button']);
  });

  it('a compound component rolls up to its parent', () => {
    expect(componentOf(`import { Table } from '@acme/ds';\nconst A = () => <Table.Row />;`)).toEqual(['Table']);
  });

  it('a namespace import is identified by the member', () => {
    expect(componentOf(`import * as DS from '@acme/ds';\nconst A = () => <DS.Button />;`)).toEqual(['Button']);
    expect(componentOf(`import * as DS from '@acme/ds';\nconst A = () => <DS.Table.Row />;`)).toEqual(['Table']);
  });

  it('a default import from a subpath is identified by the path', () => {
    expect(componentOf(`import Ico from '@acme/ds/Icon';\nconst A = () => <Ico />;`)).toEqual(['Icon']);
  });

  it('a default import from the package root falls back to the local name', () => {
    expect(componentOf(`import Thing from '@acme/ds';\nconst A = () => <Thing />;`)).toEqual(['Thing']);
  });

  it('non-DS instances carry no component', () => {
    expect(componentOf(`import { Card } from '@mui/material';\nconst A = () => <Card />;`)).toEqual([undefined]);
  });
});
