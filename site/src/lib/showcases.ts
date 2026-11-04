// The showcase: the same headless elements under completely different
// designs, each a page of its own. Every theme is one stylesheet in
// `src/showcase`, written from outside the elements with `::part()` and
// `:state()`, which is all a consumer has. No subclass, no tokens.

export type Showcase = {
  // The tags the page uses, as its facts list them.
  elements: string[];
  slug: 'cyberpunk' | 'finance' | 'rpg' | 'studio';
  summary: string;
  title: string;
};

export const showcases: Showcase[] = [
  {
    elements: [
      'slab-tabs',
      'slab-select',
      'slab-range-slider',
      'slab-toggle-group',
      'slab-progress',
      'slab-switch',
      'slab-checkbox',
      'slab-combobox',
      'slab-pin-input',
      'slab-tooltip',
      'slab-dialog',
      'slab-toast',
    ],
    slug: 'cyberpunk',
    summary:
      'A netrunner’s console: neon on black, clipped corners, glow and scanlines.',
    title: 'Cyberpunk',
  },
  {
    elements: [
      'slab-select',
      'slab-toggle-group',
      'slab-tabs',
      'slab-table',
      'slab-pagination',
      'slab-combobox',
      'slab-number',
      'slab-radio-group',
      'slab-date-picker',
      'slab-switch',
      'slab-checkbox',
      'slab-dialog',
      'slab-toast',
    ],
    slug: 'finance',
    summary:
      'A brokerage dashboard: quiet navy, hairline rules and tabular numbers.',
    title: 'Finance',
  },
  {
    elements: [
      'slab-steps',
      'slab-radio-group',
      'slab-calendar',
      'slab-toggle-group',
      'slab-text-field',
      'slab-checkbox',
      'slab-rating',
      'slab-accordion',
      'slab-disclosure',
      'slab-tooltip',
      'slab-toast',
    ],
    slug: 'studio',
    summary:
      'A pottery studio’s booking page: soft clay colors, round corners and room to breathe.',
    title: 'Studio',
  },
  {
    elements: [
      'slab-progress',
      'slab-tabs',
      'slab-listbox',
      'slab-select',
      'slab-slider',
      'slab-radio-group',
      'slab-switch',
      'slab-checkbox',
      'slab-dialog',
      'slab-toast',
    ],
    slug: 'rpg',
    summary:
      'An original retro RPG’s pause menu: gradient-blue windows, bevelled frames, a pointing cursor and HP bars.',
    title: 'Retro RPG',
  },
];
