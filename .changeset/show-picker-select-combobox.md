---
'slab-elements': minor
---

Select and Combobox have a `showPicker()` method, as Date Picker and Date Range Picker do. It opens the listbox, and like a native select's or input's, it throws a "NotAllowedError" when it isn't called from a user gesture, such as a click or a key press, and an "InvalidStateError" while the component is disabled, or while a Combobox is read-only. To open one from code without a user gesture, call `show()` or set `open`.
