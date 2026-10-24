---
'slab-elements': patch
---

Adds Tags Input, `slab-tags-input`: a native text input that turns what's typed into tags, for values with no list to pick from. Enter adds what's typed as a tag, and so does typing `delimiter` (a comma by default), so a pasted list becomes several tags. Tags are trimmed and not repeated, `max` caps how many the user can add, and what's typed is added when focus leaves. Each tag is a `<button>` that removes it, named by `removeLabel`, and the keyboard is Combobox's with `multiple`: Backspace in an empty input removes the last tag, and Left moves to the tags. `values` lists the tags, each submitted as its own entry, and the `value` attribute is the starting tags separated by commas. It's form-associated, with `required`, `setCustomValidity()`, `setValidity()` and a validity message. Style it through `::part(tag)`, `::part(tags)`, `::part(input)` and `:state(disabled)`, `:state(empty)`, `:state(error)`, `:state(full)` and `:state(required)`.
