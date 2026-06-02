export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// var(--…) name from a token path: color.surface.page -> --color-surface-page.
export const cssVar = (path) => '--' + path.replaceAll('.', '-');

export const implementsRecipes = [];
