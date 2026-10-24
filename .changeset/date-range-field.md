---
'slab-elements': patch
---

Adds Date Range Field, `slab-date-range-field`: two native date inputs, a start and an end, for picking the first and last days of a range. Each input's bound is the other's value, so a browser's picker won't offer an end before the start, and an end typed before it is `rangeUnderflow` and `rangeOverflow`, as a date outside `min` and `max` is on a single input. `start-value` and `end-value` are ISO "yyyy-mm-dd" strings, and the form gets both under `name`, the start and then the end. The group is named by `label`, and each input by it and `start-label` or `end-label`, "Start" and "End" unless you set them. Style it through its parts and `:state(disabled)`, `:state(error)`, `:state(readonly)` and `:state(required)`.
