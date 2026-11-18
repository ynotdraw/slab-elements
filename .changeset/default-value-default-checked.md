---
'slab-elements': minor
---

Every form control with a `value` attribute now has `defaultValue`, and Checkbox, Switch and Radio have `defaultChecked`, as native inputs do. Option has `defaultSelected`, and Range Slider and Date Range Field (and Picker) have `defaultStartValue` and `defaultEndValue`. Each is the attribute the control starts with and goes back to when its form resets, so reading it reads the attribute, and setting it sets the attribute. Nothing changes for existing code.
