#!/usr/bin/env node
// Reduced-motion behavioural check over the BUILT zoo (task: "Reduced motion settles
// every animated surface"). Emulates prefers-reduced-motion: reduce in headless
// Chromium and asserts every animated state/effect is stopped AND holds its declared
// rest pose — or is removed, for ambient particle fields. Also checks the focus
// indicator ("Focus is visible") and, as a guard against over-blocking, that motion
// still PLAYS when no preference is set.
//
// Run after `npm run build`:  npm run check:motion
//
// No screenshots are taken — this box forbids headless captures of the showcase; the
// assertions read computed styles only. The browser is closed in a finally.

import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zoo = join(root, 'design-system', 'dist', 'zoo', 'index.html');
if (!existsSync(zoo)) {
  console.error('✖ design-system/dist/zoo/index.html not found — run "npm run build" first.');
  process.exit(1);
}

// Resolve the playwright module. Not an npm dependency here (the browser binaries
// under ~/.cache/ms-playwright are shared machine-wide), so look where it lives:
// repo-local first, then $MOTION_PLAYWRIGHT_PATH, then known sibling checkouts.
function loadPlaywright() {
  const candidates = [
    join(root, 'node_modules', 'playwright'),
    process.env.MOTION_PLAYWRIGHT_PATH,
    '/home/dsh/projects/de-kennisbank/node_modules/playwright',
    '/home/dsh/projects/de-ontwerper/node_modules/playwright',
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(join(p, 'package.json'))) return require(p);
  }
  return null;
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = loadPlaywright();
if (!pw) {
  console.error(
    '✖ playwright module not found (looked in node_modules, $MOTION_PLAYWRIGHT_PATH, sibling projects).\n' +
      '  The reduced-motion behavioural check cannot run without it; install playwright or set MOTION_PLAYWRIGHT_PATH.',
  );
  process.exit(1);
}

// Point at a browser binary that actually exists on this machine: prefer the
// module's own pinned build, else any installed chromium under ms-playwright.
async function launch(pwModule) {
  let executablePath = pwModule.chromium.executablePath();
  if (!existsSync(executablePath)) {
    const cache = join(process.env.HOME ?? '', '.cache', 'ms-playwright');
    if (existsSync(cache)) {
      for (const entry of readdirSync(cache).sort().reverse()) {
        for (const inner of ['chrome-linux64', 'chrome-linux']) {
          const candidate = join(cache, entry, inner, 'chrome');
          if (existsSync(candidate)) {
            executablePath = candidate;
            break;
          }
        }
        if (existsSync(executablePath)) break;
      }
    }
  }
  return pwModule.chromium.launch({
    headless: true,
    executablePath,
    // Chromium's crashpad handler needs a writable HOME for its reports database;
    // on this box $HOME is not writable from a sandboxed run, so scope both to a
    // fresh temporary directory for the browser process only.
    env: { ...process.env, HOME: '/tmp/pw-home', XDG_CONFIG_HOME: '/tmp/pw-home/.config' },
  });
}

// Everything the page animates, probed through computed styles in one pass.
// Returns plain data so failures can be reported by name.
const probeMotion = () => {
  const cs = (el) => getComputedStyle(el);
  const all = (sel) => [...document.querySelectorAll(sel)];
  const out = { problems: [], counts: {} };
  const expect = (label, cond, detail) => {
    if (!cond) out.problems.push(`${label}${detail ? ` (${detail})` : ''}`);
  };

  // Ambient grid: stopped, and the breathing cell variable pinned back to --a
  // (numerically — a registered <number> property canonicalises its value).
  const cells = all('.grid i');
  out.counts.gridCells = cells.length;
  for (const el of cells) {
    expect('.grid i animation stopped', cs(el).animationName === 'none', cs(el).animationName);
    expect(
      '.grid i rest pose --bo === --a',
      Number.parseFloat(cs(el).getPropertyValue('--bo')) === Number.parseFloat(cs(el).getPropertyValue('--a')),
      `${cs(el).getPropertyValue('--bo')} vs ${cs(el).getPropertyValue('--a')}`,
    );
  }

  // Bloom drifts: stopped and back at their authored position.
  const blooms = all('.bloom .b1, .bloom .b2, .bloom .b3');
  out.counts.blooms = blooms.length;
  for (const el of blooms) {
    expect('.bloom layer stopped', cs(el).animationName === 'none');
    expect('.bloom layer rests untransformed', cs(el).transform === 'none', cs(el).transform);
  }

  // Germinating: the seed head grown in — every seed lit, none frozen mid-fill.
  const seeds = all('.gseed');
  out.counts.gseeds = seeds.length;
  for (const el of seeds) {
    expect('.gseed stopped', cs(el).animationName === 'none');
    expect('.gseed holds filled seed head @0.9', cs(el).opacity === '0.9', cs(el).opacity);
  }

  // Ripe: accent fill at scale(1).
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent-base').trim();
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.replace('#', '').slice(i - 1, i + 1), 16));
  const expected = hexRgb(accent);
  for (const el of all('.ripe')) {
    expect('.ripe stopped', cs(el).animationName === 'none');
    expect('.ripe transform is identity', cs(el).transform === 'matrix(1, 0, 0, 1, 0, 0)', cs(el).transform);
    const got = cs(el).backgroundColor.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
    expect(
      '.ripe rests at accent fill',
      got.length === 3 && got.every((c, i) => Math.abs(c - expected[i]) <= 1),
      `${cs(el).backgroundColor} vs ${accent}`,
    );
  }

  // Rising: the vessel holding water part-way up — shifted down from its full
  // resting position (ty > 0), so a legible level shows, but still inside the
  // vessel (ty < its height), not hidden below it.
  for (const el of all('.rising-fill')) {
    expect('.rising-fill stopped', cs(el).animationName === 'none');
    const ty = Number(new DOMMatrixReadOnly(cs(el).transform === 'none' ? undefined : cs(el).transform).m42);
    expect('.rising-fill holds settled water', ty > 0 && ty < el.clientHeight, `translateY=${ty}px of ${el.clientHeight}px`);
  }

  // Per-glyph header weather: every glyph static at its neutral frame.
  const glyphs = all('.wx-cell .wxc');
  out.counts.wxGlyphs = glyphs.length;
  for (const el of glyphs) {
    expect('.wxc glyph stopped', cs(el).animationName === 'none', cs(el).animationName);
    expect('.wxc glyph untransformed', cs(el).transform === 'none', cs(el).transform);
    expect('.wxc glyph full ink', cs(el).opacity === '1', cs(el).opacity);
    expect('.wxc glyph no glow', cs(el).textShadow === 'none', cs(el).textShadow);
  }
  expect('the showcase renders per-glyph weather', glyphs.length > 0);

  // Particle fields removed outright — a frozen mid-fall reads as broken.
  const fields = all('.wx-field');
  out.counts.wxFields = fields.length;
  expect('weather fields exist on the page', fields.length > 0);
  for (const el of fields) expect('.wx-field removed', cs(el).display === 'none');
  const particles = all('.gust, .mote, .drop, .splash, .fleck, .pollen, .firefly, .flake, .haze, .sunpool');
  out.counts.particles = particles.length;
  expect('particle markup exists to prove removal', particles.length > 0);
  for (const el of particles) expect('particle removed', cs(el).display === 'none');

  return out;
};

let browser;
try {
  browser = await launch(pw);

  // 1. Reduced motion: everything stopped and posed.
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await reduced.newPage();
  await page.goto(pathToFileURL(zoo).href);
  await page.waitForTimeout(300); // let fonts/layout settle before reading styles
  const { problems, counts } = await page.evaluate(probeMotion);

  // 2. Focus visibility (same session): keyboard focus must draw an outline.
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return { tag: el.tagName, cls: el.className, style: s.outlineStyle, width: s.outlineWidth };
  });
  const focusVisible = focus.style !== 'none' && parseFloat(focus.width) > 0;
  await reduced.close();

  // 3. No preference: motion must still play (the zoo keeps its life for viewers
  //    who have not asked for stillness — this change must not silence it).
  const full = await browser.newContext();
  const page2 = await full.newPage();
  await page2.goto(pathToFileURL(zoo).href);
  const playing = await page2.evaluate(() => getComputedStyle(document.querySelector('.gseed')).animationName);
  await full.close();

  const failures = [...problems];
  if (!focusVisible) failures.push(`focus indicator not visible on <${focus.tag.toLowerCase()} class="${focus.cls}"> (outline: ${focus.style} ${focus.width})`);
  if (!/^ontwerp-/.test(playing)) failures.push(`motion no longer plays without the preference (.gseed animation-name: ${playing})`);

  if (failures.length > 0) {
    console.error(`✖ Reduced-motion check failed (${failures.length}):\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `✓ Reduced motion settles every animated surface ` +
      `(grid×${counts.gridCells}, bloom×${counts.blooms}, seeds×${counts.gseeds}, glyphs×${counts.wxGlyphs}, ` +
      `fields×${counts.wxFields}, particles×${counts.particles}); focus visible; motion plays without the preference.`,
  );
} finally {
  if (browser) await browser.close();
}
