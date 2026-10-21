---
'slab-elements': patch
---

Carousel, `slab-carousel`, no longer goes back to the slide it was on when it's slow to start scrolling to another, as on a busy page. It keeps `index` until its slides reach that slide, or the user swipes or scrolls them somewhere else.
