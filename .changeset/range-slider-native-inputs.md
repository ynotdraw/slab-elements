---
'slab-elements': minor
---

Range Slider's thumbs each hold a visually hidden range input, which is what's focused and what screenreaders read, so screenreaders on phones can adjust them with a swipe up or down. The thumbs are no longer `[role=slider]`s themselves, and since they aren't focused, they don't match `:focus-visible`: style a thumb's focus ring through its new `focus-visible` part, as in `::part(start focus-visible)`.
