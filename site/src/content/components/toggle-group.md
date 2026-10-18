---
title: Toggle Group
group: Selection
element: '[role=group]'
tags: [slab-toggle-group, slab-toggle-group-button]
summary: 'A row of toggle buttons that Tab reaches once, with one pressed at a time or several.'
example: |
  <div class="stack">
    <slab-styled-toggle-group label="Finish">
      <slab-styled-toggle-group-button value="broom" pressed>Broom</slab-styled-toggle-group-button>
      <slab-styled-toggle-group-button value="trowel">Trowel</slab-styled-toggle-group-button>
      <slab-styled-toggle-group-button value="stamp">Stamp</slab-styled-toggle-group-button>
      <slab-styled-toggle-group-button value="polish" disabled>Polish</slab-styled-toggle-group-button>
    </slab-styled-toggle-group>
    <slab-styled-toggle-group label="Additives" multiple>
      <slab-styled-toggle-group-button value="fiber" pressed>Fiber</slab-styled-toggle-group-button>
      <slab-styled-toggle-group-button value="accelerator">Accelerator</slab-styled-toggle-group-button>
      <slab-styled-toggle-group-button value="color" pressed>Color</slab-styled-toggle-group-button>
    </slab-styled-toggle-group>
  </div>
usage: |
  <slab-toggle-group label="Alignment">
    <slab-toggle-group-button value="left" pressed>Left</slab-toggle-group-button>
    <slab-toggle-group-button value="center">Center</slab-toggle-group-button>
    <slab-toggle-group-button value="right">Right</slab-toggle-group-button>
  </slab-toggle-group>
---

Each item is a Toggle Group Button. The group sets each one's `aria-pressed`, so there's no ARIA to write.

## Keyboard

| Key          | What it does                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Space, Enter | Presses the focused button, or releases it. Unless `multiple` is set, pressing one releases the rest.                            |
| Left, Right  | Moves to the previous or next button, wrapping and skipping disabled ones. Up and Down instead when `orientation` is "vertical". |
| Home, End    | Moves to the first or last button.                                                                                               |
| Tab          | Leaves the group. Coming back, focus returns to the button focused last.                                                         |
