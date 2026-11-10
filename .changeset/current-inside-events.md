---
'slab-elements': patch
---

A form control's form data and validity are current as soon as its value changes, as a native control's are, whether the user changed it or code did. Before, they trailed by an update:

- Inside Radio Group's "input" and "change", `value` and the form data were the previous choice, with both the old Radio and the new one `checked`. Inside Checkbox Group's "input", `value`, `values` and the form data were the previous ones.
- Inside "input", and sometimes "change", `new FormData(form)` had the previous value for Checkbox, Switch, Text Field, Textarea, Search Field, Password Field, Number, Pin Input, Slider, Range Slider, Rating, Editable, Color Picker, Date Field, Date Range Field, Time Field and File Drop, and `validity` could be stale too.
- Setting `value`, `values` or `checked` from code, on a control or on a Radio or Checkbox in a group, left `new FormData(form)` and `validity` as they were until the next update.
- In Date Range Field, `validity` didn't follow when one date moved the other's bound.

`setCustomValidity('')` on Checkbox, Switch, Rating, Radio Group, Checkbox Group, Combobox, Listbox, Select and Tags Input now clears only the custom error, as it does natively, so a required control that's still empty stays invalid with `valueMissing`. Before, it made the control valid, and once a message had been set, the control stopped validating itself at all.
