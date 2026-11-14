---
'slab-elements': patch
---

Listbox, Combobox, Select, Command Palette, Menu, Context Menu and Tree now tell VoiceOver which item is active in Safari. Safari doesn't pass `aria-activedescendant` on to VoiceOver when it's set as an element reference, which is the only way to point from a shadow root at slotted items, so arrowing through them was silent. In WebKit, the active item is now announced as it changes, with "selected" when it is, as React Aria does on Apple devices.
