export const PALETTE = [
  {
    role: 'surface',
    note: 'the paper everything is printed on',
    pigment: 'chalk & unbleached paper',
    items: [
      { label: 'page', path: 'color.surface.page', use: 'the sheet — this background', here: true },
      { label: 'deep', path: 'color.surface.deep', use: 'margins & footer strips' },
      { label: 'claim', path: 'color.surface.claim', use: 'filled / selected cells' },
      { label: 'disabled', path: 'color.surface.disabled', use: 'inert fills — the faintest wash' },
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
      { label: 'muted', path: 'color.text.muted', use: 'the borrowed word — same ink as quiet' },
      { label: 'faint', path: 'color.text.faint', use: 'placeholders, footnotes' },
      { label: 'disabled', path: 'color.text.disabled', use: 'inert control text' },
    ],
  },
  {
    role: 'accent',
    note: 'the single accent — sparing, never decoration',
    pigment: 'madder root & red ochre',
    items: [
      { label: 'base', path: 'color.accent.base', use: 'links, the margin' },
      { label: 'soft', path: 'color.accent.soft', use: 'the accent, softened' },
      { label: 'focus ring', path: 'color.focus-ring', use: 'focus claims the full border' },
    ],
  },
  {
    role: 'destructive',
    note: 'danger keeps its own pigment — the accent never doubles as it',
    pigment: 'oxblood & burnt sienna',
    items: [
      { label: 'base', path: 'color.destructive.base', use: 'irreversible actions' },
      { label: 'soft', path: 'color.destructive.soft', use: 'danger, softened' },
    ],
  },
  {
    role: 'border',
    note: 'ink at three weights — the system draws with hairlines',
    pigment: 'the ink, let down with water',
    items: [
      { label: 'quiet', path: 'color.border.quiet', use: 'inner rules' },
      { label: 'muted', path: 'color.border.muted', use: 'the borrowed word — same rule as quiet' },
      { label: 'default', path: 'color.border.default', use: 'the default rule' },
      { label: 'strong', path: 'color.border.strong', use: 'emphasis' },
      { label: 'disabled', path: 'color.border.disabled', use: 'inert control borders' },
    ],
  },
];
