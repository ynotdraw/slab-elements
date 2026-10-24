---
title: Tags Input
group: Form
element: '<input> + <button>s'
tags: [slab-tags-input]
summary: 'A text input that turns what you type into removable tags, for values with no list to pick from, submitted one entry per tag.'
example: |
  <slab-styled-tags-input label="Pour tags" value="footing, east wing" placeholder="Add a tag" max="5">
    <span slot="description">Press Enter or type a comma. Try pasting "rebar, cure, slump".</span>
  </slab-styled-tags-input>
usage: |
  <slab-tags-input label="Keywords" name="keywords" value="concrete, rebar"></slab-tags-input>
---

Enter adds what's typed as a tag, and so does typing `delimiter`, a comma unless you change it, so a pasted list becomes several tags at once. Tags are trimmed, and a tag that's already there isn't added twice. With `max`, no more are added once there are that many, and what didn't fit stays in the input. What's typed is added when focus leaves too, so it isn't lost on a submit.

Each tag is a button before the input that removes it, named "Remove" and the tag unless you set `removeLabel`. `values` lists the tags in the order they were added, and each is submitted as its own entry, the way a `<select multiple>` submits them. The `value` attribute is the starting tags separated by commas, as on an `<input type="email" multiple>`. To pick tags from a list instead, use [Combobox](../combobox/) with `multiple`, whose tags work the same way.

Style a field with no tags through `:state(empty)` and one with `max` tags through `:state(full)`.

## Keyboard

| Key                             | What it does                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Enter                           | Adds what's typed as a tag, or submits the form when nothing is typed.                          |
| `delimiter`                     | Adds what's typed before it as a tag.                                                           |
| Escape                          | Clears what's typed.                                                                            |
| Backspace                       | In an empty input, removes the last tag.                                                        |
| Left                            | At the start of the input, moves to the last tag.                                               |
| Left, Right                     | On a tag, moves to the previous or next one. Right from the last goes back to the input.        |
| Backspace, Delete, Enter, Space | On a tag, removes it and moves to the one that takes its place, or the input when there's none. |
| Escape                          | On a tag, goes back to the input.                                                               |
| Tab, Shift+Tab                  | Moves out of the field. The tags aren't Tab stops.                                              |
