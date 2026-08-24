import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseBundleOnce } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// One shared build for every assertion in this suite.
const releaseOnce = releaseBundleOnce(join(root, 'design-system', 'source', 'values'));

// WCAG relative luminance — "light" as a checkable property, not an adjective.
function relativeLuminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const channel = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Spec: design-language / Requirement: Theming is light-only by design +
// Requirement: Existing dark themes have a supported integration response.
// Done-when (roadmap C9): a consumer with an existing .dark theme finds the
// light-only stance AND its rationale in the bundle, so the shipped consumer
// docs are asserted here, not just the repo sources.
describe('light-only theming stance travels in the bundle', () => {
  it('language/theming.md states the stance, its rationale, and both .dark choices', async () => {
    const rel = await releaseOnce();
    const theming = readFileSync(join(rel, 'language', 'theming.md'), 'utf8');

    // Every skin keeps a light paper ground; variation is hue, not polarity.
    expect(theming).toMatch(/every skin is a .{0,40}light paper/is);
    expect(theming).toContain('hue');
    expect(theming).toMatch(/never lightness\s+polarity|not lightness polarity/i);

    // Dark mode is out of scope by design — and why.
    expect(theming).toMatch(/no dark mode/i);
    expect(theming).toMatch(/by design|deliberate stance|out of scope/i);
    for (const material of ['grain', 'multiply', 'ink']) {
      expect(theming, `rationale mentions ${material}`).toContain(material);
    }

    // Both supported responses to an application's own .dark theme.
    expect(theming).toContain('.dark');
    expect(theming).toMatch(/keep the system's chrome/i); // choice 1
    expect(theming).toMatch(/omit the system from dark-mode surfaces/i); // choice 2

    // And neither choice is a dark palette: none is owed or shipped.
    expect(theming).not.toMatch(/\bdark (skin|theme|mode) (is )?supported\b/i);
    expect(theming).toMatch(/ships none|owes itself none|not a supported path/);
  });

  it('language/anti-goals.md rejects dark skins and lightness inversion', async () => {
    const rel = await releaseOnce();
    const antiGoals = readFileSync(join(rel, 'language', 'anti-goals.md'), 'utf8');
    expect(antiGoals).toMatch(/No Dark Mode/i);
    expect(antiGoals).toMatch(/dark skins?/i);
    expect(antiGoals).toMatch(/inversion|inverted themes?/i);
  });

  it('the consumer AGENTS.md offers both supported .dark responses', async () => {
    const rel = await releaseOnce();
    const agents = readFileSync(join(rel, 'AGENTS.md'), 'utf8');
    expect(agents).toMatch(/Theming is light-only/i);
    expect(agents).toContain('.dark');
    expect(agents).toMatch(/keep this system's chrome/i);
    expect(agents).toMatch(/omit the system from those\s+dark-mode surfaces/i);
  });

  it('the consumer README names the light-only stance', async () => {
    const rel = await releaseOnce();
    const readme = readFileSync(join(rel, 'README.md'), 'utf8');
    expect(readme).toMatch(/light-only/i);
    expect(readme).toMatch(/keep this system's chrome light|leave the\s+system off those surfaces/i);
  });
});

// Spec: design-language / Requirement: Light-only theming remains
// documentation-only. The change adds prose only — no dark skin, no dark-mode
// runtime path, no new visual token values. These gates fail if a later edit
// reintroduces any of them.
describe('no dark implementation ships', () => {
  it('every skin is a light paper surface', async () => {
    const skins = JSON.parse(
      readFileSync(join(root, 'design-system', 'source', 'skins', 'skins.json'), 'utf8'),
    );
    expect(skins.length).toBeGreaterThan(0);
    for (const skin of skins) {
      const page = skin.supply['color.surface.page'];
      expect(page, `${skin.id} supplies color.surface.page`).toBeTruthy();
      expect(
        relativeLuminance(page),
        `${skin.id} paper ${page} must be a light ground`,
      ).toBeGreaterThanOrEqual(0.5);
      expect(skin.id.toLowerCase(), `${skin.id} must not be a dark skin`).not.toContain('dark');
    }
  });

  it('every shipped stylesheet carries no dark-mode runtime path', async () => {
    const rel = await releaseOnce();
    const cssDir = join(rel, 'values', 'css');
    // Enumerate, never hardcode: fonts.css ships beside the token/scoped
    // outputs today, and a file added later must not escape this gate.
    const files = readdirSync(cssDir, { recursive: true })
      .filter((f) => f.endsWith('.css'))
      .map((f) => join(cssDir, f));
    for (const file of files) {
      const css = stripComments(readFileSync(file, 'utf8'));
      expect(css, `${file}: no prefers-color-scheme branch`).not.toContain('prefers-color-scheme');
      expect(css, `${file}: no .dark selector`).not.toMatch(/\.dark[\s,{[.:]/);
      expect(css, `${file}: no [data-theme] selector`).not.toMatch(/\[data-theme/i);
    }
  });

  it('shipped js exposes no dark-mode runtime path', async () => {
    const rel = await releaseOnce();
    const jsDir = join(rel, 'values', 'js');
    for (const f of readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
      // matchMedia('(prefers-color-scheme: …)') and CSS branches both spell it
      // out; a theme toggle would have no other way in.
      const src = readFileSync(join(jsDir, f), 'utf8');
      expect(src, `${f}: no prefers-color-scheme branch`).not.toContain('prefers-color-scheme');
    }
  });

  it('the token manifest carries no dark/lightness-polarity values', async () => {
    const rel = await releaseOnce();
    const manifest = JSON.parse(readFileSync(join(rel, 'values', 'manifest', 'tokens.json'), 'utf8'));
    const offenders = manifest.filter((e) => /dark|night/i.test(e.path));
    expect(offenders.map((e) => e.path)).toEqual([]);
  });
});
