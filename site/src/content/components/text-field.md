---
title: Text Field
group: Form
element: '<input>'
tags: [slab-text-field]
summary: 'A single-line text field built on the native input, validation and all.'
example: |
  <slab-styled-text-field label="Job name" placeholder="14 Alder Lane" required>
    <span slot="description">Leave it empty and tab away to see an error.</span>
  </slab-styled-text-field>
usage: |
  <slab-text-field label="Email" name="email" type="email" required></slab-text-field>
---

`selectionStart`, `selectionEnd`, `selectionDirection`, `select()`, `setSelectionRange()` and `setRangeText()` work as they do on a native input, for things like a toolbar that wraps the selected text. Like a native input's, `setRangeText()` dispatches no "input" or "change". An email field has no selection, as an email input has none: the properties are `null`, and setting them, `setSelectionRange()` and `setRangeText()` throw.
