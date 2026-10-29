---
'slab-elements': patch
---

Checkbox Group and Radio Group now tell screenreaders when they're invalid. Radio Group sets `aria-invalid` on its radiogroup. A group role can't take `aria-invalid`, so Checkbox Group sets it on each of its Checkboxes instead. Both follow the Group's validity feedback, so they're marked once its validity is reported and cleared once it's valid.
