---
title: Slider
group: Form
element: '<input type=range>'
tags: [slab-slider]
summary: 'A single-thumb slider built on the native range input.'
example: |
  <slab-styled-slider label="Slump" max="7" min="2" step="0.5" value="4">
    <span slot="description">Inches. A wetter mix is easier to place and weaker once it cures.</span>
  </slab-styled-slider>
usage: |
  <slab-slider label="Volume" name="volume" min="0" max="100" value="50"></slab-slider>
---

Screenreaders read the value as a bare number. When it means more than that, set `formatValue` to a function of the value, such as `` (value) => `$${value}` ``, and they'll read what it returns instead.

Its value is always in range, so it's never invalid on its own. For a rule of your own, such as a minimum, call `setCustomValidity()` with a message. It shows in `::part(validity-message)`, and the host matches `:state(error)`, once validity is reported, as on [Text Field](../text-field/): when focus leaves, when its form is submitted, or on `reportValidity()`.

## Keyboard

| Key                   | What it does                                     |
| --------------------- | ------------------------------------------------ |
| Left, Down, Right, Up | Steps the value down or up, as on a range input. |
| Page Up, Page Down    | Steps it by more, where the browser does.        |
| Home, End             | Moves to the minimum or maximum.                 |
