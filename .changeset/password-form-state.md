---
'slab-elements': patch
---

Password Field, a Text Field whose `type` is "password", and a masked Pin Input no longer have their value restored by the browser after navigating back or restoring a session, as a native password input doesn't. Neither does a Text Field or Pin Input with `autocomplete="off"`.
