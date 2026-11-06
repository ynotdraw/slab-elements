---
'slab-elements': minor
---

**Breaking:** Toast's "dismiss" can be canceled to keep the toast shown, as Alert's can. So it's now dispatched before the toast hides rather than after, and `open` is still `true` in a "dismiss" listener.
