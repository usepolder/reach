import type {
  JSXOpeningElement,
  JSXMemberExpression,
  JSXIdentifier,
} from '@babel/types';
import traverseModule from '@babel/traverse';
import type { Ast } from './parse';
import type { ImportMap } from './imports';

// @babel/traverse ships CJS with the function on `default`; depending on how the
// consumer bundles/loads this file the import binding is either the function or
// the module object. Normalize once.
const traverse: typeof traverseModule =
  (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule;

export type InstanceKind = 'ds' | 'other' | 'styled-host' | 'unstyled-host';

export interface Instance {
  /** Element name as written, e.g. 'Btn', 'Table.Row', 'div'. */
  element: string;
  kind: InstanceKind;
  /** 1-based source line of the opening element. */
  line: number;
  /** The matched component_library package, when kind is 'ds'. */
  dsPackage?: string;
}

/** True when `source` is `pkg` itself or a subpath of it (`@acme/ds/Button`). */
function matchesPackage(source: string, pkg: string): boolean {
  return source === pkg || source.startsWith(`${pkg}/`);
}

function rootIdentifier(name: JSXMemberExpression): JSXIdentifier {
  let obj = name.object;
  while (obj.type === 'JSXMemberExpression') obj = obj.object;
  return obj;
}

function renderName(name: JSXOpeningElement['name']): string {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
  return `${renderName(name.object as JSXOpeningElement['name'])}.${name.property.name}`;
}

// <Fragment> and <React.Fragment> render nothing themselves — excluded from the
// denominator entirely, same as <>...</> (which never produces an opening element).
function isFragment(name: JSXOpeningElement['name']): boolean {
  if (name.type === 'JSXIdentifier') return name.name === 'Fragment';
  if (name.type === 'JSXMemberExpression') return name.property.name === 'Fragment';
  return false;
}

const STYLED_ATTRIBUTES = new Set(['className', 'style']);

function isStyled(node: JSXOpeningElement): boolean {
  return node.attributes.some(
    (attr) =>
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      STYLED_ATTRIBUTES.has(attr.name.name),
  );
}

function classifyHost(node: JSXOpeningElement, name: string, line: number): Instance {
  return { element: name, kind: isStyled(node) ? 'styled-host' : 'unstyled-host', line };
}

function classifyComponent(
  localName: string,
  element: string,
  line: number,
  importMap: ImportMap,
  dsPackages: string[],
): Instance {
  const binding = importMap.get(localName);
  if (binding) {
    const pkg = dsPackages.find((p) => matchesPackage(binding.source, p));
    if (pkg) return { element, kind: 'ds', line, dsPackage: pkg };
  }
  // Imported from elsewhere, or not imported at all (defined in this file):
  // a component instance that isn't the design system.
  return { element, kind: 'other', line };
}

/**
 * Classify every JSX opening element in the file per the Reach denominator
 * ruling. Fragments are omitted; unstyled hosts are returned (for transparency
 * counts) but excluded from the score by the report layer.
 */
export function classifyInstances(
  ast: Ast,
  importMap: ImportMap,
  dsPackages: string[],
): Instance[] {
  const instances: Instance[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      const node = path.node;
      const name = node.name;
      if (isFragment(name)) return;
      const line = node.loc?.start.line ?? 0;
      const rendered = renderName(name);

      if (name.type === 'JSXIdentifier') {
        if (/^[a-z]/.test(name.name)) {
          instances.push(classifyHost(node, rendered, line));
        } else {
          instances.push(classifyComponent(name.name, rendered, line, importMap, dsPackages));
        }
      } else if (name.type === 'JSXMemberExpression') {
        // Member expressions resolve to their root: <Table.Row> resolves Table,
        // <DS.Button> resolves the DS namespace import.
        const root = rootIdentifier(name);
        instances.push(classifyComponent(root.name, rendered, line, importMap, dsPackages));
      } else {
        // JSXNamespacedName (<svg:path>) — a host element.
        instances.push(classifyHost(node, rendered, line));
      }
    },
  });

  return instances;
}
