---
'slab-elements': patch
---

Combobox takes `multiple`. Each selected Option is shown before the input as a tag, a button that removes it, and choosing an Option toggles it and leaves the listbox open. Backspace in an empty input removes the last tag, and Left at the start of the input moves to the tags. `values` reads and sets every selected value, in the order they were chosen, and each is submitted as its own entry, as a `<select multiple>` submits them. Style the tags with `::part(tag)` and `::part(tags)`, and name their buttons with `removeLabel`.
