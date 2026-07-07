// .polder.yml parsing. component_library handling is lifted verbatim from
// usepolder/drift src/config.ts (v1.1.2) so one config file powers both tools;
// the `reach:` block is new. Drift-only keys (allowlist, fail_on_drift, tokens,
// library_paths, ...) are accepted and ignored — a repo already configured for
// Drift works for Reach untouched.
import * as yaml from 'js-yaml';

export interface ReachSettings {
  include: string[];
  exclude: string[];
  /** CI gate: fail when score < fail_under. 0 = off. Never changes the score. */
  failUnder: number;
}

export interface ReachConfig {
  componentLibrary: string[];
  reach: ReachSettings;
}

export const DEFAULT_INCLUDE = ['**/*'];
export const DEFAULT_EXCLUDE = ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'];

export function defaultReachSettings(): ReachSettings {
  return { include: [...DEFAULT_INCLUDE], exclude: [...DEFAULT_EXCLUDE], failUnder: 0 };
}

interface RawConfig {
  component_library?: string | string[];
  reach?: {
    include?: unknown;
    exclude?: unknown;
    fail_under?: unknown;
  };
}

function requireStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || !value.every((x) => typeof x === 'string' && x.length > 0)) {
    throw new Error(`${key} must be an array of non-empty strings`);
  }
  return value as string[];
}

export function parseConfig(raw: string): ReachConfig {
  let parsed: unknown;
  try {
    parsed = yaml.load(raw);
  } catch (err) {
    throw new Error(`Invalid YAML in .polder.yml: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid .polder.yml: must be a YAML object');
  }

  const cfg = parsed as RawConfig;

  if (cfg.component_library === undefined || cfg.component_library === null) {
    throw new Error('component_library is required in .polder.yml');
  }

  let componentLibrary: string[];
  if (typeof cfg.component_library === 'string') {
    componentLibrary = [cfg.component_library];
  } else if (Array.isArray(cfg.component_library)) {
    if (cfg.component_library.length === 0) {
      throw new Error('component_library is required in .polder.yml');
    }
    if (!cfg.component_library.every((x) => typeof x === 'string')) {
      throw new Error('component_library entries must all be strings');
    }
    componentLibrary = cfg.component_library;
  } else {
    throw new Error('component_library must be a string or array of strings');
  }

  const reach = defaultReachSettings();
  if (cfg.reach !== undefined) {
    if (typeof cfg.reach !== 'object' || cfg.reach === null || Array.isArray(cfg.reach)) {
      throw new Error('reach must be a YAML object');
    }
    if (cfg.reach.include !== undefined) {
      reach.include = requireStringArray(cfg.reach.include, 'reach.include');
    }
    if (cfg.reach.exclude !== undefined) {
      reach.exclude = requireStringArray(cfg.reach.exclude, 'reach.exclude');
    }
    if (cfg.reach.fail_under !== undefined) {
      const n = cfg.reach.fail_under;
      if (typeof n !== 'number' || Number.isNaN(n) || n < 0 || n > 100) {
        throw new Error('reach.fail_under must be a number between 0 and 100');
      }
      reach.failUnder = n;
    }
  }

  return { componentLibrary, reach };
}

export function readConfig(content: string | null): ReachConfig | null {
  if (content === null) return null;
  return parseConfig(content);
}
