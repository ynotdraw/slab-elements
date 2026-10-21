---
title: Pin Input
group: Form
element: '<input>'
tags: [slab-pin-input]
summary: 'A PIN or one-time code field: a row of native inputs, one per character, that submits as one value.'
example: |
  <slab-styled-pin-input label="Site access code" length="6" autocomplete="one-time-code" required>
    <span slot="description">Sent to the foreman's phone. Try pasting "482-913".</span>
  </slab-styled-pin-input>
usage: |
  <slab-pin-input label="Verification code" name="code" autocomplete="one-time-code" required></slab-pin-input>
---

The inputs fill from the start, without gaps, and the row is one tab stop. A pasted or autofilled code is spread across them from the input it lands in, keeping only the characters `type` accepts, so "123-456" fills six. Listen for "complete" to verify a code as soon as the last character is in.

The group is named by `label`, and each input by `inputLabel`, "Character 1 of 6" and so on unless you set it. Lay the inputs out with `::part(inputs)`, and style an input with a character in it with `::part(filled)`.

## Keyboard

| Key            | What it does                                                                         |
| -------------- | ------------------------------------------------------------------------------------ |
| A character    | Fills the focused input and moves to the next.                                       |
| Backspace      | Deletes the focused input's character, or the one before it when the input is empty. |
| Delete         | Deletes the focused input's character.                                               |
| Left, Right    | Moves to the previous or next input, up to the first empty one.                      |
| Home, End      | Moves to the first input, or to where typing continues.                              |
| Enter          | Submits the form.                                                                    |
| Tab, Shift+Tab | Moves out of the field.                                                              |
