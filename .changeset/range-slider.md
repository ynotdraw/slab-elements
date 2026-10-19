---
'slab-elements': patch
---

Adds Range Slider, `slab-range-slider`: a two-thumb slider for picking a range, following the APG multi-thumb slider pattern. Each thumb is a `[role=slider]` bounded by the other, so they can meet but not pass. `start-value` and `end-value` are the range, clamped to `min` and `max` and snapped to `step`, and the form gets both under `name`. Drag a thumb, press the track to bring the nearer one there, or use the arrow keys, Page Up and Page Down, and Home and End. Style it through its parts and `:state(disabled)` and `:state(dragging)`.
