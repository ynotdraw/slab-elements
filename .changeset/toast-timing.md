---
'slab-elements': patch
---

Toast no longer dismisses itself on a timer when it has something to act on, such as an Undo button or a link, whatever `duration` says (WCAG 2.2.1). F6 now moves focus to the open toast shown most recently, and F6 from inside it moves focus back, as react-aria's toasts do. Dismissing a toast with focus in it moves focus back too.
