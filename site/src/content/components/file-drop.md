---
title: File Drop
group: Form
element: '<input type=file>'
tags: [slab-file-drop]
summary: 'A file input you can also drop files onto. One list of files, either way.'
example: |
  <slab-styled-file-drop label="Site photos" accept="image/*" multiple>
    <span slot="description">Photos of the forms and the rebar, for the inspector.</span>
  </slab-styled-file-drop>
usage: |
  <slab-file-drop label="Attachments" name="attachments" multiple></slab-file-drop>
---

A drop is held to what the picker would allow: files that don't match `accept` are left out, and without `multiple`, a drop of several files is ignored. A drop has no picker to say what happened, so screenreaders are told how many files were added and how many were left out. Change what they're told with `addedLabel` and `notAcceptedLabel`, functions of the count, and `too-many-label`.

## Keyboard

| Key          | What it does                                         |
| ------------ | ---------------------------------------------------- |
| Enter, Space | Opens the browser's file picker, as on a file input. |
