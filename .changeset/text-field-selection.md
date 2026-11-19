---
'slab-elements': minor
---

Text Field, Textarea, Search Field and Password Field have `selectionStart`, `selectionEnd` and `selectionDirection` properties and a `setRangeText()` method, as a native input and textarea do, beside the `select()` and `setSelectionRange()` they already had. Each works on the input or textarea inside, so it behaves as a native one: `setRangeText()` updates `value` and dispatches no "input" or "change", and on a Text Field with `type="email"` the properties are `null`, and setting them, `setSelectionRange()` and `setRangeText()` throw an "InvalidStateError", as on an email input. Nothing changes for existing code.
