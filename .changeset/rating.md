---
'slab-elements': patch
---

Adds Rating, `slab-rating`: a row of native radios, one for each point from 1 to `max` (5 by default), in a `[role=radiogroup]` named by `label`. `value` is the checked radio's number, and the form gets it under `name`. It's form-associated, with `required`, `setCustomValidity()`, `setValidity()` and a validity message, as on Radio Group. Each radio is `::part(star)`, and those up to the value are `::part(filled)` too. While the pointer is over a radio, those up to it are `filled` instead, and the host is `:state(previewing)`. Style it through its parts and `:state(disabled)`, `:state(error)`, `:state(previewing)` and `:state(required)`.
