---
'slab-elements': patch
---

Combobox and Tags Input have `readonly`, as the other fields that take typing do. The value can't be changed, but it's still focusable and submitted and never invalid. A Combobox's listbox doesn't open, and the tags of both are text rather than buttons that remove them.
