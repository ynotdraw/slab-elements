---
'slab-elements': patch
---

Adds Color Picker, `slab-color-picker`: a saturation and brightness area, a hue slider, an alpha slider with `alpha`, a hex field, and swatches from `swatches`. The area and the sliders are `[role=slider]`s, stepped with the arrow keys, Page Up and Page Down, and Home and End, or dragged, and the swatches are a listbox whose selection follows focus. `value` is a lowercase "#rrggbb", or "#rrggbbaa" with `alpha`, and the form gets it under `name`. Style it through its parts, `:state(disabled)` and `:state(dragging)`, and the `--color-picker-hue`, `--color-picker-opaque` and `--color-picker-value` custom properties it sets.
