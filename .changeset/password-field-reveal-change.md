---
'slab-elements': major
---

**Breaking:** Password Field's show-and-hide button dispatches "reveal-change" instead of "toggle". "toggle" is the `ToggleEvent` that elements with `open` dispatch, and Password Field's wasn't one. Read `revealed` in the handler for whether the password shows.
