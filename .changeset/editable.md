---
'slab-elements': patch
---

Adds Editable, `slab-editable`: text that's edited in place, such as a title or a name. It's a native button showing the value, named by `label` and then the value, that becomes a native input when it's pressed, with the text selected. Enter commits what's typed and Escape discards it, and both put focus back on the button. Moving focus away commits it too. `value` is the last committed value, and it's what the form gets under `name`. "change" is dispatched when an edit is committed with a different value. `edit()`, `commit()` and `cancel()` do what the keys do, and `editing` says which is showing. While it's empty, the button shows `placeholder`. Style it through `::part(preview)`, `::part(input)`, `::part(label)` and `::part(description)`, and `:state(disabled)`, `:state(editing)` and `:state(empty)`.
