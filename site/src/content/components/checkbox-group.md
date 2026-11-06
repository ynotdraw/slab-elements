---
title: Checkbox Group
group: Form
element: '[role=group]'
tags: [slab-checkbox-group]
summary: 'A set of Checkboxes with one label, one value, and one validity between them.'
example: |
  <slab-styled-checkbox-group label="Before the pour">
    <slab-styled-checkbox label="The forms are level" value="forms" checked></slab-styled-checkbox>
    <slab-styled-checkbox label="The rebar is tied" value="rebar" checked></slab-styled-checkbox>
    <slab-styled-checkbox label="The vapor barrier is down" value="barrier"></slab-styled-checkbox>
    <slab-styled-checkbox label="The inspector signed off" value="inspection"></slab-styled-checkbox>
    <span slot="description">Check them off as the crew does.</span>
  </slab-styled-checkbox-group>
usage: |
  <slab-checkbox-group label="Toppings" name="toppings">
    <slab-checkbox label="Cheese" value="cheese"></slab-checkbox>
    <slab-checkbox label="Onions" value="onions"></slab-checkbox>
  </slab-checkbox-group>
---

Each item is a [Checkbox](../checkbox/).

The group dispatches no "input" or "change" of its own. Each Checkbox's bubble up through it, as a native checkbox's do through a `<fieldset>`, so listen on the group and read its `values`.

## Keyboard

| Key   | What it does                                     |
| ----- | ------------------------------------------------ |
| Tab   | Moves between the Checkboxes, each its own stop. |
| Space | Checks or unchecks the focused one.              |
