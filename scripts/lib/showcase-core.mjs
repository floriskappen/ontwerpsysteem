// Delegate to the new modular design system source.
// This file is kept at this location for backwards compatibility with the existing build/test paths.

import { renderShowcase as modularRenderShowcase } from '../../design-system/source/zoo/index.mjs';

export function renderShowcase(opts) {
  return modularRenderShowcase(opts);
}
