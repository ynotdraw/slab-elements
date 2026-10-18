---
title: Toggle Group
group: Selection
element: '<button aria-pressed>'
tags: [slab-toggle-group]
summary: 'A row of toggle buttons that Tab reaches once, with one pressed at a time or several.'
example: |
  <div class="stack">
    <slab-styled-toggle-group label="Finish">
      <button aria-pressed="true" value="broom">Broom</button>
      <button value="trowel">Trowel</button>
      <button value="stamp">Stamp</button>
      <button value="polish" disabled>Polish</button>
    </slab-styled-toggle-group>
    <slab-styled-toggle-group label="Additives" multiple>
      <button aria-pressed="true" value="fiber">Fiber</button>
      <button value="accelerator">Accelerator</button>
      <button aria-pressed="true" value="color">Color</button>
    </slab-styled-toggle-group>
  </div>
usage: |
  <slab-toggle-group label="Alignment">
    <button aria-pressed="true" value="left">Left</button>
    <button value="center">Center</button>
    <button value="right">Right</button>
  </slab-toggle-group>
---

## Keyboard

| Key          | What it does                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Space, Enter | Presses the focused button, or releases it. Unless `multiple` is set, pressing one releases the rest.                            |
| Left, Right  | Moves to the previous or next button, wrapping and skipping disabled ones. Up and Down instead when `orientation` is "vertical". |
| Home, End    | Moves to the first or last button.                                                                                               |
| Tab          | Leaves the group. Coming back, focus returns to the button focused last.                                                         |
