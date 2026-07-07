export { BABEL_OPTIONS, parseSource, type Ast } from './parse';
export {
  parseConfig,
  readConfig,
  defaultReachSettings,
  DEFAULT_INCLUDE,
  DEFAULT_EXCLUDE,
  type ReachConfig,
  type ReachSettings,
} from './config';
export { walk, SOURCE_EXTENSIONS, STYLE_EXTENSIONS } from './walk';
export { buildImportMap, type ImportMap, type ImportBinding } from './imports';
export { classifyInstances, type Instance, type InstanceKind } from './instances';
export {
  SCHEMA_VERSION,
  buildReport,
  tallyInstances,
  emptyFileCounts,
  type ReachReport,
  type ReachCounts,
  type FileCounts,
  type LeakCounts,
  type LeakItem,
} from './report';
export { findLeaks, buildLeakCounts } from './leaks';
export { scanRepo } from './scan';
