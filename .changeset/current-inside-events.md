---
'slab-elements': patch
---

A form control is current inside its own "input" and "change" listeners, as a native control is. Before, what a listener read could be from before the change:

- Radio Group's `value` and form data were the previous choice, with both the old Radio and the new one `checked`.
- Checkbox Group's `value`, `values` and form data were the previous ones inside "input".
- Checkbox, Switch, Text Field, Textarea, Search Field, Password Field, Number, Pin Input, Slider, Range Slider, Rating, Editable, Color Picker, Date Field, Date Range Field, Time Field and File Drop submitted their previous value to `new FormData(form)` inside "input", and some inside "change" too. Their `validity` could trail the same way.
