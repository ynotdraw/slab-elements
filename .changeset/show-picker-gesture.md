---
'slab-elements': major
---

**Breaking:** Date Picker's and Date Range Picker's `showPicker()` throw as a native input's does: a "NotAllowedError" without a user gesture, and an "InvalidStateError" while disabled or read-only. Set `open` to open the calendar from code.
