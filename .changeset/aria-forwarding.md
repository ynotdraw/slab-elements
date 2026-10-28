---
'slab-elements': patch
---

`aria-*` attributes on a component's host now reach the element a screenreader reads, such as Text Field's `<input>` or Disclosure's `<summary>`, in Checkbox, Color Picker, Combobox, Date Field, Disclosure, File Drop, Number, Pin Input, Range Slider, Slider, Switch, Text Field, Textarea and Time Field. Before, an `aria-label` or `aria-describedby` you put on the host went unread, and so did the description Tooltip gives its anchor and the `aria-expanded` Popover and Menu give theirs when the anchor was one of these. ID references, such as `aria-describedby`, are resolved where the host is and kept in step as they change.
