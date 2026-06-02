// Style Dictionary build, parameterised by source/output directory so it can be
// driven both by the CLI (scripts/build.mjs) and by tests (temp dirs). The build
// is gated on validation: if the tokens do not conform, it throws BuildAborted
// and writes nothing to the output directory.
//
// Name derivation is a single documented rule — the kebab transform — applied to
// every target, so `color.text.muted` becomes `color-text-muted` (and
// `--color-text-muted` in CSS/Tailwind) across all outputs. This mapping is part
// of the public contract.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { validateTokenDir, TIERS } from './validate-core.mjs';
import { renderShowcase } from './showcase-core.mjs';

const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'fonts');

// Self-host the fonts: base64-inline the woff2s as @font-face so the showcase
// renders in Archivo / JetBrains Mono / Caveat while staying a single
// self-contained file (no network, openable over file://). Deterministic — same
// bytes every build. Caveat is the zoo's handwritten annotation voice (section
// figures, marks); the system's content type stays Archivo + JetBrains Mono.
let _fontCss;
function fontCss() {
  if (_fontCss === undefined) {
    const b64 = (f) => readFileSync(join(FONTS_DIR, f)).toString('base64');
    const face = (family, weight, file) =>
      `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; font-display: swap; ` +
      `src: url(data:font/woff2;base64,${b64(file)}) format('woff2'); }`;
    _fontCss = [
      face('Archivo', '500 700', 'archivo-latin.woff2'),
      face('JetBrains Mono', '500', 'jetbrains-mono-latin.woff2'),
      face('Caveat', '500 700', 'caveat-latin.woff2'),
    ].join('\n');
  }
  return _fontCss;
}

export class BuildAborted extends Error {
  constructor(errors) {
    super(`Build aborted: ${errors.length} token validation violation(s).`);
    this.name = 'BuildAborted';
    this.errors = errors;
  }
}

let _registered = false;
function registerOnce() {
  if (_registered) return;
  _registered = true;

  // ESM object: keys are the derived (kebab) names, values are resolved. Typed
  // via a sibling .d.ts. No file header → deterministic output.
  StyleDictionary.registerFormat({
    name: 'esm/object',
    format: ({ dictionary }) => {
      const lines = dictionary.allTokens.map(
        (t) => `  ${JSON.stringify(t.name)}: ${JSON.stringify(t.$value ?? t.value)},`,
      );
      return `const tokens = {\n${lines.join('\n')}\n};\n\nexport default tokens;\n`;
    },
  });

  StyleDictionary.registerFormat({
    name: 'esm/dts',
    format: ({ dictionary }) => {
      const lines = dictionary.allTokens.map((t) => `  ${JSON.stringify(t.name)}: string;`);
      return `declare const tokens: {\n${lines.join('\n')}\n};\n\nexport default tokens;\n`;
    },
  });

  // Structured manifest: one entry per token carrying the metadata the flat
  // CSS/JS outputs drop (tier, $type, raw alias, description). Tier comes from
  // the source file path; the raw alias from the pre-resolution original value.
  StyleDictionary.registerFormat({
    name: 'json/manifest',
    format: ({ dictionary }) => {
      const entries = dictionary.allTokens.map((t) => {
        const fp = (t.filePath ?? '').replaceAll('\\', '/');
        const tier = TIERS.find((x) => fp.includes(`/${x}/`)) ?? null;
        const original = t.original?.$value ?? t.original?.value;
        const isAlias = typeof original === 'string' && /^\{.+\}$/.test(original.trim());
        const entry = {
          path: t.path.join('.'),
          name: t.name,
          tier,
          type: t.$type ?? t.type ?? null,
          value: t.$value ?? t.value,
          ref: isAlias ? original.trim().slice(1, -1) : null,
        };
        const description = t.$description ?? t.description;
        if (description) entry.description = description;
        return entry;
      });
      return `${JSON.stringify(entries, null, 2)}\n`;
    },
  });
}

function makeConfig(tokensDir, distDir) {
  const fileHeader = false;
  return {
    source: [`${tokensDir}/**/*.tokens.json`],
    usesDtcg: true,
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `${distDir}/css/`,
        files: [
          {
            destination: 'tokens.css',
            format: 'css/variables',
            options: { selector: ':root', outputReferences: false, showFileHeader: fileHeader },
          },
        ],
      },
      tailwind: {
        transformGroup: 'css',
        buildPath: `${distDir}/tailwind/`,
        files: [
          {
            destination: 'theme.css',
            format: 'css/variables',
            options: { selector: '@theme', outputReferences: false, showFileHeader: fileHeader },
          },
        ],
      },
      js: {
        transforms: ['attribute/cti', 'name/kebab', 'color/css'],
        buildPath: `${distDir}/js/`,
        files: [
          { destination: 'tokens.js', format: 'esm/object' },
          { destination: 'tokens.d.ts', format: 'esm/dts' },
        ],
      },
      manifest: {
        transforms: ['attribute/cti', 'name/kebab', 'color/css'],
        buildPath: `${distDir}/manifest/`,
        files: [{ destination: 'tokens.json', format: 'json/manifest' }],
      },
    },
  };
}

/**
 * Validate then build. Throws BuildAborted (without writing output) if invalid.
 * @param {{tokensDir?: string, distDir?: string}} opts
 */
export async function runBuild({ tokensDir = 'tokens', distDir = 'dist' } = {}) {
  const { errors } = validateTokenDir(tokensDir);
  if (errors.length > 0) throw new BuildAborted(errors);

  registerOnce();
  const sd = new StyleDictionary(makeConfig(tokensDir, distDir));
  await sd.buildAllPlatforms();

  // Generate the showcase from the freshly built artifacts only (the manifest
  // and the token CSS) — never from the token sources — so it reflects exactly
  // what ships. Inputs are inlined into a single self-contained HTML file.
  const manifest = JSON.parse(readFileSync(join(distDir, 'manifest', 'tokens.json'), 'utf8'));
  const tokenCss = readFileSync(join(distDir, 'css', 'tokens.css'), 'utf8');
  const html = renderShowcase({ manifest, tokenCss, fontCss: fontCss() });
  mkdirSync(join(distDir, 'showcase'), { recursive: true });
  writeFileSync(join(distDir, 'showcase', 'index.html'), html);

  return { errors: [] };
}
