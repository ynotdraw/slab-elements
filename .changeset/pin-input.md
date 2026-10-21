---
'slab-elements': patch
---

Adds Pin Input, `slab-pin-input`: a PIN or one-time code field as a row of native inputs, one per character, that reads and submits as one value. Typing moves to the next input and Backspace moves back. A pasted or autofilled code, such as one offered by `autocomplete="one-time-code"`, is spread across the inputs, with separators like "-" left out. `length` sets how many characters, `type="alphanumeric"` accepts letters as well as digits, and `mask` hides them. An empty required field is `valueMissing` and a partly filled one `tooShort`, and "complete" is dispatched when every input is filled. Style it through its parts and `:state(complete)`, `:state(disabled)`, `:state(error)`, `:state(readonly)` and `:state(required)`.
