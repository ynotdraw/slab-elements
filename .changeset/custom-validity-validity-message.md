---
'slab-elements': minor
---

Every form control now has a `custom-validity` attribute and a `validity-message` slot, to make validation errors easier to show.

- `custom-validity` is `setCustomValidity()` from markup. The control is invalid with that message, and the message shows right away, without waiting for validity to be reported. Use it for errors you already know about, such as ones from a server. Remove it, or set it to an empty string, to make the control valid again.
- Content in the `validity-message` slot shows in place of the validity message's text, while the control is invalid and its message shows. Use it for wording of your own, a translation or a link. `validationMessage` is unchanged.

Also fixed: on Checkbox, Checkbox Group, Combobox, Listbox, Radio Group, Rating, Select, Switch and Tags Input, a message from `setCustomValidity()` on a control that wasn't required was cleared by the control's next update.

Nothing changes for existing code.
