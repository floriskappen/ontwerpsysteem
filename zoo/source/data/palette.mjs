export const PALETTE = [
  {
    role: 'surface',
    note: 'the paper everything is printed on',
    pigment: 'chalk & unbleached paper',
    items: [
      { label: 'page', path: 'color.surface.page', use: 'the sheet — this background', here: true },
      { label: 'deep', path: 'color.surface.deep', use: 'margins & footer strips' },
      { label: 'claim', path: 'color.surface.claim', use: 'filled / selected cells' },
    ],
  },
  {
    role: 'ink',
    note: 'one warm near-black, stepped down for hierarchy',
    pigment: 'oak gall & lampblack',
    items: [
      { label: 'default', path: 'color.text.default', use: 'primary text' },
      { label: 'soft', path: 'color.text.soft', use: 'secondary text' },
      { label: 'quiet', path: 'color.text.quiet', use: 'utility marks' },
      { label: 'faint', path: 'color.text.faint', use: 'placeholders, footnotes' },
    ],
  },
  {
    role: 'accent',
    note: 'the single accent — sparing, never decoration',
    pigment: 'madder root & red ochre',
    items: [
      { label: 'base', path: 'color.accent.base', use: 'links, focus, the margin' },
      { label: 'soft', path: 'color.accent.soft', use: 'the accent, softened' },
    ],
  },
  {
    role: 'border',
    note: 'ink at three weights — the system draws with hairlines',
    pigment: 'the ink, let down with water',
    items: [
      { label: 'quiet', path: 'color.border.quiet', use: 'inner rules' },
      { label: 'default', path: 'color.border.default', use: 'the default rule' },
      { label: 'strong', path: 'color.border.strong', use: 'emphasis' },
    ],
  },
];
