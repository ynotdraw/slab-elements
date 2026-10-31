---
'slab-elements': minor
---

Splitter's separator holds a visually hidden range input, which is what's focused and what screenreaders read, so screenreaders on phones can move it with a swipe up or down. The separator is no longer a `[role=separator]` itself, so screenreaders read it as a slider, and since it isn't focused, it doesn't match `:focus-visible`: style its focus ring through its new `focus-visible` part, as in `::part(separator focus-visible)`.
