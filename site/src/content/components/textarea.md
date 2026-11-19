---
title: Textarea
group: Form
element: '<textarea>'
tags: [slab-textarea]
summary: 'A multi-line text field built on the native textarea.'
example: |
  <slab-styled-textarea label="Pour notes" placeholder="Weather, crew, anything unusual">
    <span slot="description">Shown to the crew on the morning of the pour.</span>
  </slab-styled-textarea>
usage: |
  <slab-textarea label="Message" name="message" rows="4" maxlength="500"></slab-textarea>
---

`selectionStart`, `selectionEnd`, `selectionDirection`, `select()`, `setSelectionRange()` and `setRangeText()` work as they do on a native textarea, for things like a toolbar that wraps the selected text. Like a native textarea's, `setRangeText()` dispatches no "input" or "change".
