---
'slab-elements': patch
---

Switch now shows when it's invalid, the way Checkbox does. Before, a required Switch left off blocked submission without saying why. Once its validity is reported it sets `aria-invalid` and `:state(error)` and shows a `validity-message` part, worded by the browser unless you give it one. It also has `validationMessage`, `willValidate`, `setCustomValidity()`, `setValidity()`, and `resetValidityFeedback()`.
