---
'slab-elements': patch
---

Adds Password Field, `slab-password-field`: a native password input with a button that shows and hides the password. The button is a toggle button named by `toggle-label` ("Show password" by default) whose `aria-pressed` follows `revealed`, and it fires "toggle" when pressed. While the password shows the input is a text input, with spellcheck, autocorrect and autocapitalize off. `revealed` works like `value`, so the attribute is the default and a form reset hides the password again. It's form-associated with Text Field's API: `required`, `minlength`, `maxlength`, `pattern`, `autocomplete`, `setCustomValidity()`, `setValidity()` and a validity message. Style it through `::part(control)`, `::part(input)`, `::part(toggle-button)` and `:state(disabled)`, `:state(error)`, `:state(readonly)`, `:state(required)` and `:state(revealed)`.
