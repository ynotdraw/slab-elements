---
title: Toggle Button
group: Selection
element: '<button aria-pressed>'
tags: [slab-toggle-button]
summary: "One button that stays pressed until it's pressed again, for a setting that's on or off."
example: |
  <div class="stack">
    <slab-styled-toggle-button pressed>Grid lines</slab-styled-toggle-button>
    <slab-styled-toggle-button>Snap to grid</slab-styled-toggle-button>
    <slab-styled-toggle-button disabled>Rebar</slab-styled-toggle-button>
  </div>
usage: |
  <slab-toggle-button label="Mute">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /></svg>
  </slab-toggle-button>
---

For a setting that's applied as soon as it changes, such as a preference, a Switch reads more clearly. For a row of these, such as Bold, Italic and Underline, use Toggle Group, so Tab reaches them once and the arrow keys move between them.

## Keyboard

| Key          | What it does                                            |
| ------------ | ------------------------------------------------------- |
| Enter, Space | Presses the button, or releases it, as on a `<button>`. |
