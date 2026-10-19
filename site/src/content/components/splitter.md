---
title: Splitter
group: Disclosure
element: '[role=separator]'
tags: [slab-splitter]
summary: 'Two panes with a separator between them that resizes them, dragged or moved with the keyboard.'
example: |
  <slab-styled-splitter label="Mixes" min="20" max="80" value="35" style="block-size: 14rem">
    <div slot="primary">
      <strong>Mixes</strong>
      <p>Footing, slab, wall.</p>
    </div>
    <div slot="secondary">
      <strong>Slab</strong>
      <p>4,000 psi, a 4-inch slump, broom finish. Cure for seven days before it takes a load.</p>
    </div>
  </slab-styled-splitter>
usage: |
  <slab-splitter label="Sidebar" min="15" max="50" value="25">
    <nav slot="primary">…</nav>
    <main slot="secondary">…</main>
  </slab-splitter>
---

The separator is named by `label`, which should name the primary pane, since that's the one `value` sizes. Give the splitter a size, such as a `block-size`, or it's as tall as its tallest pane.

## Keyboard

| Key         | What it does                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Left, Right | Moves the separator by `step`, the way the arrow points, so Left shrinks the primary pane unless it's on the right. Up and Down when `orientation` is "horizontal". |
| Home, End   | Moves the separator to `min` or `max`.                                                                                                                              |
| Enter       | Collapses the primary pane to `min`, or restores it to where it was.                                                                                                |
