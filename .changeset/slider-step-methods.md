---
'slab-elements': minor
---

Slider and Range Slider have `stepUp(count?)` and `stepDown(count?)` methods, as a native range input does. They step the value by `step` times `count`, which is 1 when left out, keep it to `min` and `max`, and dispatch no "input" or "change". Slider's throw an `InvalidStateError` when `step` is "any", as a range input's do. Range Slider's take the thumb to step as a second argument, "start" or "end", and step the thumb that has focus, or the start thumb, when it's left out. A thumb stops at the other thumb, as it does with the keyboard.
