---
title: Range Slider
group: Form
element: '[role=slider]'
tags: [slab-range-slider]
summary: 'A two-thumb slider for picking a range, with a thumb at each end that can meet but not pass the other.'
example: |
  <slab-styled-range-slider label="Slump" max="7" min="2" step="0.5" start-value="3" end-value="5">
    <span slot="description">Inches. Most slabs pour between 3 and 5.</span>
  </slab-styled-range-slider>
usage: |
  <slab-range-slider label="Price" name="price" min="0" max="500" start-value="100" end-value="300"></slab-range-slider>
---

Each thumb is named by `label` and then its own label, "Minimum" and "Maximum" unless you set `start-label` and `end-label`, so a screenreader reads "Price Minimum". The form gets two entries under `name`, the start and then the end. Give the track a size, since the thumbs and the range between them are placed along it.

## Keyboard

| Key                   | What it does                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Left, Down, Right, Up | Steps the focused thumb down or up by `step`. Left and Right move it the way the arrow points. |
| Page Up, Page Down    | Steps it by a tenth of the range.                                                              |
| Home, End             | Moves it as far as it can go: to `min` or `max`, or to the other thumb.                        |
