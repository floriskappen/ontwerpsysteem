import { escapeHtml } from '../effects/helpers.mjs';

export function renderType() {
  const specimen = [
    ['display', 'de ontwerp', '168px', '0.92'],
    ['t-heading-lg', 'a quiet, warm system', '40px', '1.02'],
    ['t-heading-md', 'where the work is pointing', '20px', '1.1'],
    ['t-body', 'cream paper, one ink, one accent, square corners. small enough to hold in your head, warm enough to want to.', '15px', '1.5'],
    ['t-body-sm', 'utility text, footnotes, the small print that still has to read well', '13px', '1.45'],
  ];
  const lines = specimen
    .map(
      ([cls, text, size, lh]) =>
        `<div class="spec-row"><span class="spec-tag"><span class="spec-role">${escapeHtml(cls.replace(/^t-/, '').replace(/-/g, ' '))}</span>` +
        `<span class="val">${escapeHtml(size)} · ${escapeHtml(lh)}</span></span>` +
        `<p class="${cls} spec-line">${escapeHtml(text)}</p></div>`,
    )
    .join('');
  
  const figures =
    `<div class="spec-row"><span class="spec-tag"><span class="spec-role">figures</span>` +
    `<span class="val">caveat</span></span>` +
    `<p class="spec-fig spec-line">0 1 2 3 4 5 6 7 8 9</p></div>`;
  return `<div class="spec">${lines}${figures}<p class="spec-foot">archivo, lowercased · weights 500–700 · jetbrains mono for values · caveat for figures</p></div>`;
}
export const implementsRecipes = [];
