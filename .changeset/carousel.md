---
'slab-elements': patch
---

Adds Carousel, `slab-carousel`: a region of slides, following the APG carousel pattern. The slides are a CSS scroll snap container, so swiping, scrolling and the arrow keys move between them natively in every browser. Previous and Next, a marker per slide, and a rotation button when `autoplay` is set are real buttons, rather than the `::scroll-button()` and `::scroll-marker` pseudo-elements only Chromium has, so they're named and styled the same everywhere. `index` is the current slide's, `loop` wraps Previous and Next, and `autoplay` moves on every `interval` milliseconds, pausing while the carousel is hovered or focused. Slides out of view are `inert`. Style it through its parts and `:state(first)`, `:state(last)` and `:state(rotating)`.
