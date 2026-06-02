import { escapeHtml, cssVar } from '../effects/helpers.mjs';
import { PALETTE } from '../data/palette.mjs';

export function renderPalette(manifest) {
  const value = new Map(manifest.map((e) => [e.path, e.value]));
  const groups = PALETTE.map((g) => {
    const swatches = g.items
      .map((it) => {
        const v = value.get(it.path);
        const onInk = it.path.startsWith('color.text') || it.path === 'color.accent.base';
        return (
          `<figure class="sw${onInk ? ' sw-ink' : ''}${it.here ? ' sw-here' : ''}">` +
          `<div class="sw-chip" style="background:var(${cssVar(it.path)})">` +
          (it.here ? `<span class="sw-here-tag">you are here</span>` : '') +
          `</div>` +
          `<figcaption class="sw-meta">` +
          `<span class="sw-name">${escapeHtml(it.label)}</span>` +
          `<span class="sw-use">${escapeHtml(it.use)}</span>` +
          (v ? `<span class="val sw-val">${escapeHtml(String(v))}</span>` : '') +
          `</figcaption></figure>`
        );
      })
      .join('');
    return (
      `<div class="role">` +
      `<div class="role-head"><span class="role-name">${escapeHtml(g.role)}</span>` +
      `<span class="role-note">${escapeHtml(g.note)}</span></div>` +
      `<div class="role-swatches">${swatches}</div></div>`
    );
  }).join('');
  
  const pigment =
    `<div class="role pigment">` +
    `<div class="role-head"><span class="role-name">pigment</span>` +
    `<span class="role-note">ink let down with water — it bleeds into the paper and deepens where colours layer, the way real dye does</span></div>` +
    `<div class="pigment-plate" aria-hidden="true"><i class="blot blot-a"></i><i class="blot blot-b"></i><i class="blot blot-c"></i></div>` +
    `</div>`;
  return `<div class="palette">${groups}${pigment}</div>`;
}
export const implementsRecipes = [
  "material.pigment.multiply-blot"
];
