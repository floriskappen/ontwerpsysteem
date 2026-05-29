import { readdirSync, readFileSync, statSync, mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

export function tmpDir(prefix = 'ont-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Read a directory tree into a sorted map of relPath -> file contents (Buffer). */
export function readTree(dir) {
  const out = new Map();
  function walk(d) {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.set(relative(dir, full), readFileSync(full));
    }
  }
  walk(dir);
  return out;
}

/** True if two directory trees are byte-identical. */
export function treesEqual(a, b) {
  const ta = readTree(a);
  const tb = readTree(b);
  if (ta.size !== tb.size) return false;
  for (const [rel, buf] of ta) {
    const other = tb.get(rel);
    if (!other || !buf.equals(other)) return false;
  }
  return true;
}
