---
'slab-elements': minor
---

Form controls now have the defaults that native inputs have. The fields, Select, Combobox, Listbox, Slider and the other controls that take one `value` have `defaultValue`. Checkbox, Switch and Radio have `defaultChecked`, and Option has `defaultSelected`. Range Slider and Date Range Field (and Picker) have `defaultStartValue` and `defaultEndValue`. Checkbox Group and Radio Group reset through their Checkboxes' and Radios' `defaultChecked`, and File Drop, like a file input, has no default. Each is the attribute the control starts with and goes back to when its form resets, so reading it reads the attribute, and setting it sets the attribute. Nothing changes for existing code.
