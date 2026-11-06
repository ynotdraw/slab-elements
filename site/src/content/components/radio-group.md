---
title: Radio Group
group: Form
element: '[role=radiogroup]'
tags: [slab-radio-group, slab-radio-group-radio]
summary: 'A set of Radios with one label, one value, and exactly one checked.'
example: |
  <slab-styled-radio-group label="Mix strength">
    <slab-styled-radio-group-radio label="3,000 psi" value="3000">
      <div><strong>3,000 psi</strong><br />Sidewalks and patios.</div>
    </slab-styled-radio-group-radio>
    <slab-styled-radio-group-radio label="4,000 psi" value="4000" checked>
      <div><strong>4,000 psi</strong><br />House foundations.</div>
    </slab-styled-radio-group-radio>
    <slab-styled-radio-group-radio label="5,000 psi" value="5000">
      <div><strong>5,000 psi</strong><br />Heavy loads and cold climates.</div>
    </slab-styled-radio-group-radio>
  </slab-styled-radio-group>
usage: |
  <slab-radio-group label="Delivery" name="delivery">
    <slab-radio-group-radio label="Standard" value="standard" checked>Standard</slab-radio-group-radio>
    <slab-radio-group-radio label="Express" value="express">Express</slab-radio-group-radio>
  </slab-radio-group>
---

The group dispatches no "input" or "change" of its own. Each Radio's bubble up through it, as a native radio's do through a `<fieldset>`, so listen on the group and read its `value`.

## Keyboard

| Key                   | What it does                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| Tab                   | Moves into the group at the checked Radio, or the first, and out again.                 |
| Up, Down, Left, Right | Moves to the previous or next Radio and checks it, wrapping and skipping disabled ones. |
| Space                 | Checks the focused Radio.                                                               |
| Enter                 | Submits the form, as on a native radio.                                                 |
