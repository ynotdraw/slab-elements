---
title: Color Picker
group: Form
element: '[role=slider]'
tags: [slab-color-picker]
summary: 'A color picker with a saturation and brightness area, hue and alpha sliders, a hex field and swatches.'
example: |
  <slab-styled-color-picker label="Stain" value="#8a5a3c" swatches="#8a5a3c #a0522d #6b6b6b #3f4a3c #c2b280">
    <span slot="description">Acid stain reacts with the lime in the slab, so the cured color varies.</span>
  </slab-styled-color-picker>
usage: |
  <slab-color-picker label="Fill" name="fill" value="#3399ff" swatches="#ff0000 #00ff00 #0000ff" alpha></slab-color-picker>
---

The area, the hue slider and the alpha slider are each a `[role=slider]`, named by `label` and then their own label, so a screenreader reads "Fill Hue". The area's value text reads both of its values, "Saturation 60%, Brightness 100%". Give the area and the sliders a size, since their thumbs are placed along them. The form gets `value` under `name`.

The hex field commits when it's blurred or Enter is pressed, with or without the "#", and goes back to `value` when what's typed isn't a color. The swatches are a listbox whose selection follows focus.

## Keyboard

| Key                   | What it does                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Left, Right           | In the area, steps saturation. On a slider, steps it. Each moves the thumb the way it points. |
| Down, Up              | In the area, steps brightness. On a slider, steps it.                                         |
| Page Up, Page Down    | In the area, steps brightness by 10. On a slider, steps it by a tenth.                        |
| Home, End             | In the area, moves saturation to 0 or 100. On a slider, moves it to either end.               |
| Left, Down, Right, Up | In the swatches, moves to the previous or next swatch and selects it.                         |
| Home, End             | In the swatches, moves to the first or last swatch and selects it.                            |
| Enter                 | In the hex field, commits it.                                                                 |
