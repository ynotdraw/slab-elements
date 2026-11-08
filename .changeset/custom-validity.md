---
'slab-elements': minor
---

Slider, Range Slider, Color Picker and Editable have the validity API the other form controls do: `setCustomValidity()`, `setValidity()`, `validationMessage`, `willValidate` and `resetValidityFeedback()`, with a `validity-message` part and `:state(error)`. Their values are never invalid on their own, so this is for rules of your own. Their `description` part is now a `<div>` around the description slot and the validity message, as on Text Field, rather than the slot itself.
