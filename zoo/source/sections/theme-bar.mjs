import { escapeHtml } from '../effects/helpers.mjs';
import { SKINS } from '../data/skins.mjs';

export function renderThemeBar() {
  const tabs = SKINS.map((s, i) => {
    const sw = s.vars
      ? { surface: s.vars['color-surface-page'], accent: s.vars['color-accent-base'] }
      : { surface: '#F1ECE0', accent: '#B84A39' };
    return (
      `<input class="th-radio" type="radio" name="th" id="th-${s.id}"${i === 0 ? ' checked' : ''}>` +
      `<label class="th-tab" for="th-${s.id}">` +
      `<span class="th-chip" style="--s:${sw.surface};--a:${sw.accent}"></span>${escapeHtml(s.label)}</label>`
    );
  }).join('');

  const rules = SKINS.map((s) => {
    const pieces = [];
    if (s.vars) {
      const decls = Object.entries(s.vars)
        .map(([k, v]) => `--${k}: ${v};`)
        .join(' ');
      const bloom =
        '--wx-bloom-a: var(--color-surface-claim); --wx-bloom-b: var(--color-accent-soft); --wx-bloom-c: var(--color-accent-soft); --wx-pollen: var(--color-accent-soft);';
      pieces.push(`body:has(#th-${s.id}:checked) { ${decls} ${bloom} }`);
    }
    pieces.push(`#th-${s.id}:checked + .th-tab { background: var(--color-text-default); color: var(--color-surface-page); }`);
    pieces.push(`#th-${s.id}:focus-visible + .th-tab { outline: 2px solid var(--color-accent-base); outline-offset: -2px; }`);
    return pieces.join('\n');
  }).join('\n');

  return (
    `<style>\n/* illustrative skins — these override colour roles for the demo only; they are not\n   shipped [data-theme] token themes. */\n${rules}\n</style>\n` +
    `<div class="theme-bar">` +
    `<span class="theme-switch-label">theme</span>` +
    `<div class="theme-seg">${tabs}</div>` +
    `</div>`
  );
}
export const implementsRecipes = [
  "theme.recipes.json"
];
