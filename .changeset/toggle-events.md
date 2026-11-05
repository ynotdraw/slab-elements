---
'slab-elements': minor
---

Every element with `open` now dispatches "toggle" when it opens and closes, as a `ToggleEvent` with `oldState` and `newState`:

- Menu, Context Menu, Select and Combobox dispatch it for the first time.
- **Breaking:** Tooltip and Hover Card's "toggle" is now a `ToggleEvent` that, like a popover's, doesn't bubble and isn't composed. Listen on the element itself rather than on an ancestor.
