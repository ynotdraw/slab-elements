---
title: Editable
group: Form
element: '<button> + <input>'
tags: [slab-editable]
summary: 'Text that is edited in place, such as a title or a name: a button showing the value that becomes an input when pressed.'
example: |
  <slab-styled-editable label="Job name" value="14 Alder Lane" placeholder="Name this job">
    <span slot="description">Click the name, type, and press Enter. Escape puts it back.</span>
  </slab-styled-editable>
usage: |
  <slab-editable label="Title" name="title" value="Footing pour"></slab-editable>
---

Until it's pressed, it's a button showing the value, named by the label and then the value, so it reads as "Job name, 14 Alder Lane". Clicking it, or its label, starts editing, with the text selected so typing replaces it. Enter keeps what's typed and Escape discards it, and both put focus back on the button. Moving focus away keeps it too, so a click elsewhere or a Tab doesn't lose an edit.

`value` is what was last committed, and it's what the form gets under `name`. It doesn't change while the input is typed into, only when an edit is committed, and that's when "change" is dispatched, if the value is different. The `value` attribute is the default, which a form reset goes back to. `edit()`, `commit()` and `cancel()` do what the keys do, and `editing` says which is showing.

While it's empty, the button shows `placeholder`, and `:state(empty)` styles it. A field that's disabled while it's being edited stops, and what was typed is discarded. For a field that's always an input, use [Text Field](../text-field/).

## Keyboard

| Key          | What it does                                                         |
| ------------ | -------------------------------------------------------------------- |
| Enter, Space | On the button, starts editing, with the text selected.               |
| Enter        | In the input, keeps what's typed and goes back to the button.        |
| Escape       | In the input, discards what's typed and goes back to the button.     |
| Tab          | In the input, keeps what's typed and moves on, as a click away does. |
