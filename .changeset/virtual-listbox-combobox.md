---
'slab-elements': patch
---

Listbox and Combobox have a `virtual` attribute for lists of thousands of Options. Only the Options in or near view are laid out, with spacers in place of the rest, while the keys, typeahead, filtering and selection still reach every Option. Rendered Options get `aria-posinset` and `aria-setsize`, and the active one stays in the accessibility tree when it's scrolled away from.

Listbox and Combobox are also much faster with long lists whether or not they're virtual: they no longer do work for every Option each time one of them connects or changes, which made a thousand Options take seconds to appear.
