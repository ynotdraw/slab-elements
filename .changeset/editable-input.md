---
'slab-elements': minor
---

Editable dispatches "input" just before "change" when a committed edit changes its value, as a native `<select>` does, so it fires both events like every other field. It still doesn't dispatch "input" while typing, because `value` only changes when an edit is committed.
