---
'slab-elements': patch
---

Text Field, Textarea, Number, Date Field, Time Field, File Drop, Checkbox, Checkbox Group, Radio Group, Listbox, Select, Combobox, Rating and Pin Input now show the browser's own validity message, in the browser's language, when one fails a built-in constraint and you haven't given it a `validity-message`. Before, a required field left empty was invalid but said nothing, so a screenreader user wasn't told why the form wouldn't submit. Each also has `validationMessage` and `willValidate`, as a native control does.
