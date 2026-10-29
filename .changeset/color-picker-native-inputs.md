---
'slab-elements': minor
---

Color Picker's thumbs each hold a visually hidden range input, which is what's focused and what screenreaders read, so screenreaders on phones can adjust them with a swipe up or down. The area has a second one for its brightness, "Brightness" after `label`, left out of the tab order. The thumbs are no longer `[role=slider]`s themselves, and since they aren't focused, they don't match `:focus-visible`: style a thumb's focus ring through its new `focus-visible` part, as in `::part(hue-thumb focus-visible)`.
