---
'slab-elements': patch
---

Splitter's separator no longer scrolls the page when it's dragged in Safari on iOS. It cancels "touchstart" while it isn't disabled, since `touch-action: none` alone doesn't stop the scroll there.
