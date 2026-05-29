// Style Dictionary build, parameterised by source/output directory so it can be
// driven both by the CLI (scripts/build.mjs) and by tests (temp dirs). The build
// is gated on validation: if the tokens do not conform, it throws BuildAborted
// and writes nothing to the output directory.
//
// Name derivation is a single documented rule — the kebab transform — applied to
// every target, so `color.text.muted` becomes `color-text-muted` (and
// `--color-text-muted` in CSS/Tailwind) across all outputs. This mapping is part
// of the public contract.

import StyleDictionary from 'style-dictionary';
import { validateTokenDir } from './validate-core.mjs';

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
  return { errors: [] };
}
