#!/usr/bin/env node
// Cut a release of the consumer bundle. Agent-drafts / human-approves:
//
//   node scripts/release.mjs                 draft: show proposed version + changelog
//   node scripts/release.mjs --write [--minor|--major|--patch]
//                                            apply the draft (bump VERSION, prepend a
//                                            CHANGELOG skeleton) for a human to edit
//   node scripts/release.mjs --publish       publish the (human-approved) bundle to the
//                                            `release` branch + tag — never automatic
//
// Draft and --write never publish. --publish never bumps or invents a changelog; it
// only ships what a human has finalised. Nothing is pushed to a remote.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runBuild } from './lib/build-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
const shQuiet = (cmd, opts = {}) => { try { return sh(cmd, opts); } catch { return ''; } };

const VERSION_FILE = join(root, 'design-system', 'VERSION');
const CHANGELOG = join(root, 'CHANGELOG.md');

function currentVersion() {
  return readFileSync(VERSION_FILE, 'utf8').trim();
}

function lastReleaseTag() {
  const tags = shQuiet("git tag -l 'v*' --sort=-v:refname").split('\n').filter(Boolean);
  return tags[0] || null;
}

function bump(version, kind) {
  const [maj, min, pat] = version.split('.').map((n) => parseInt(n, 10));
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'patch') return `${maj}.${min}.${pat + 1}`;
  return `${maj}.${min + 1}.0`; // minor (default, additive)
}

// Recipe + language IDs whose source changed since the last release (or all of them
// for the initial release). Recipe IDs come from the changed recipe JSON files;
// language "IDs" are the changed language file basenames.
function touchedIds(lastTag) {
  const recipesDir = join(root, 'design-system', 'recipes');
  const allRecipeIds = () =>
    JSON.parse(readFileSync(join(recipesDir, 'index.json'), 'utf8')).map((r) => r.id);

  if (!lastTag) {
    const langs = shQuiet("git ls-files design-system/language")
      .split('\n').filter((f) => f.endsWith('.md'))
      .map((f) => `language/${f.split('/').pop().replace('.md', '')}`);
    return { recipes: allRecipeIds(), language: langs };
  }

  const changed = shQuiet(`git diff --name-only ${lastTag}..HEAD -- design-system/recipes design-system/language`)
    .split('\n').filter(Boolean);
  const recipeIds = new Set();
  const langs = new Set();
  for (const f of changed) {
    if (f.includes('/language/') && f.endsWith('.md')) {
      langs.add(`language/${f.split('/').pop().replace('.md', '')}`);
    } else if (f.includes('/recipes/') && f.endsWith('.recipes.json')) {
      try {
        for (const r of JSON.parse(readFileSync(join(root, f), 'utf8'))) recipeIds.add(r.id);
      } catch { /* skip unparseable */ }
    }
  }
  return { recipes: [...recipeIds], language: [...langs] };
}

function draftEntry(version, ids) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [`## ${version} — ${date}`, ''];
  const all = [...ids.language, ...ids.recipes];
  lines.push('### Changed', ...(all.length ? all.map((id) => `- \`${id}\`: <what changed> [**BREAKING** if meaning changed]`) : ['- <none — nothing durable changed>']));
  lines.push('', '**Propagation:** <what a consumer must re-check after advancing the pin>', '');
  return lines.join('\n');
}

// ── publish: ship the human-approved bundle to the `release` branch + tag ──────
async function publish(version) {
  const tag = `v${version}`;
  if (shQuiet(`git tag -l ${tag}`)) throw new Error(`tag ${tag} already exists — bump VERSION first`);
  // the latest changelog entry must match VERSION (proxy for "human finalised it")
  const top = (readFileSync(CHANGELOG, 'utf8').match(/^## (\d\S*)/m) || [])[1];
  if (top !== version) throw new Error(`CHANGELOG top entry is ${top}, VERSION is ${version} — finalise the changelog first`);

  // fresh, deterministic bundle
  await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: join(root, 'design-system', 'dist') });
  const bundle = join(root, 'design-system', 'dist', 'release');
  if (!existsSync(bundle)) throw new Error('no assembled bundle found');

  const branchExists = !!shQuiet('git show-ref --verify --quiet refs/heads/release && echo y');
  const wt = mkdtempSync(join(tmpdir(), 'ds-release-'));
  try {
    sh(`git worktree add -f --detach "${wt}"`);
    if (branchExists) execSync('git checkout release', { cwd: wt });
    else execSync('git checkout --orphan release', { cwd: wt });
    execSync('git rm -rfq . || true', { cwd: wt, shell: '/bin/bash' });
    cpSync(bundle, wt, { recursive: true }); // bundle contents become the branch root
    execSync('git add -A', { cwd: wt });
    execSync(`git commit -q -m "release: ${tag}"`, { cwd: wt });
    execSync(`git tag ${tag}`, { cwd: wt });
  } finally {
    shQuiet(`git worktree remove --force "${wt}"`);
  }
  console.log(`✓ Published ${tag} to the 'release' branch (one commit, tagged).`);
  console.log(`  Review: git log --oneline release`);
  console.log(`  Publish to remote when ready: git push origin release ${tag}`);
}

// ── main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const version = currentVersion();
const lastTag = lastReleaseTag();

if (args.includes('--publish')) {
  await publish(version);
} else if (args.includes('--write')) {
  const kind = args.includes('--major') ? 'major' : args.includes('--patch') ? 'patch' : 'minor';
  const next = bump(version, kind);
  const ids = touchedIds(lastTag);
  // prepend the draft entry above the first existing entry
  const cl = readFileSync(CHANGELOG, 'utf8');
  const at = cl.search(/^## /m);
  const updated = at === -1 ? cl + '\n' + draftEntry(next, ids) : cl.slice(0, at) + draftEntry(next, ids) + '\n' + cl.slice(at);
  writeFileSync(CHANGELOG, updated);
  writeFileSync(VERSION_FILE, next + '\n');
  console.log(`✓ Drafted ${next} (${kind}). Edit CHANGELOG.md to fill in the entry, then:`);
  console.log(`    npm run release -- --publish`);
} else {
  // draft (read-only)
  const kind = args.includes('--major') ? 'major' : args.includes('--patch') ? 'patch' : 'minor';
  const next = bump(version, kind);
  const ids = touchedIds(lastTag);
  console.log(`current: ${version}   last release: ${lastTag || '(none)'}   proposed (${kind}): ${next}\n`);
  console.log('Draft changelog entry:\n');
  console.log(draftEntry(next, ids));
  console.log('Apply with:  npm run release -- --write [--major|--minor|--patch]');
  console.log('Then finalise CHANGELOG.md and:  npm run release -- --publish');
}
