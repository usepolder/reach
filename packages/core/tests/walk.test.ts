import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { walk, SOURCE_EXTENSIONS } from '../src/walk';

let dir: string;

function put(rel: string, content = 'export {};\n') {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-walk-'));
  put('src/App.tsx');
  put('src/util.ts');
  put('src/styles.css', 'body {}\n');
  put('src/App.test.tsx');
  put('node_modules/@acme/ds/Button.tsx');
  put('dist/bundle.js');
  put('README.md', '# hi\n');
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('walk', () => {
  it('finds source files, skips node_modules/dist and non-source extensions', () => {
    const files = walk(dir, ['**/*'], [], SOURCE_EXTENSIONS);
    expect(files).toEqual(['src/App.test.tsx', 'src/App.tsx', 'src/util.ts']);
  });

  it('applies config exclude globs', () => {
    const files = walk(dir, ['**/*'], ['**/*.test.*'], SOURCE_EXTENSIONS);
    expect(files).toEqual(['src/App.tsx', 'src/util.ts']);
  });

  it('applies include globs', () => {
    const files = walk(dir, ['src/App*'], [], SOURCE_EXTENSIONS);
    expect(files).toEqual(['src/App.test.tsx', 'src/App.tsx']);
  });
});
