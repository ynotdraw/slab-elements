---
'slab-elements': patch
---

Adds Copy Button, `slab-copy-button`: a native `<button>` that writes text to the clipboard when it's pressed. It copies `value`, or, with `from`, the `value` or rendered text of the element with that `id` at the moment it's pressed, so a code block or an input can be copied without keeping `value` in step. Once copied, `copied-label` ("Copied") is announced from a status beside the button, the host matches `:state(copied)` for `feedback-duration` (2000ms by default), and "copied" is dispatched. When the clipboard refuses, as it does in a page that isn't served securely, `failed-label` is announced, the host matches `:state(failed)`, and "copy-error" is dispatched instead. Style it through `::part(button)`, `:state(copied)` and `:state(failed)`.
