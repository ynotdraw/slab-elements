---
'slab-elements': patch
---

Adds Splitter, `slab-splitter`: two panes, in its "primary" and "secondary" slots, with a `[role=separator]` between them that resizes them, following the APG window splitter pattern. Drag the separator, or move it with the arrow keys by `step`, Home and End to `min` and `max`, and Enter to collapse the primary pane and restore it. `value` is the primary pane's share as a percentage, and `orientation="horizontal"` stacks the panes. Style it through its parts and `:state(collapsed)`, `:state(disabled)` and `:state(dragging)`.
