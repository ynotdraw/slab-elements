---
'slab-elements': patch
---

Text Field, Number, Pin Input and Combobox now leave Enter to an input method while it's composing, such as one for Japanese or Chinese. Before, the Enter that confirms a conversion submitted the form, or chose the active Option in Combobox. Safari's composition-ending Enter, which doesn't set `isComposing`, is recognized too.
