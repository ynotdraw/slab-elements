---
title: Form
group: Form
element: '<form>'
tags: [slab-form]
summary: "A `<form>` that Slab's controls submit, reset, and validate with — just like native ones."
example: |
  <slab-styled-form label="Schedule a pour">
    <slab-styled-text-field label="Job name" name="job" value="14 Alder Lane foundation" required></slab-styled-text-field>
    <slab-styled-date-field label="Pour date" name="date" required></slab-styled-date-field>
    <slab-styled-number label="Cubic yards" min="1" name="yards" value="38"></slab-styled-number>
    <div>
      <button class="styled-button styled-button--primary">Schedule</button>
    </div>
  </slab-styled-form>
usage: |
  <slab-form label="Sign up" action="/sign-up" method="post">
    <slab-text-field label="Email" name="email" type="email" required></slab-text-field>
    <button>Sign up</button>
  </slab-form>
---

A plain `<form>` works with Slab's controls too. Reach for Form when you
want what it adds: a label that makes the form a landmark, and a
`checkValidity()` that doesn't show errors, just like a native one.

## Keyboard

| Key   | What it does                                      |
| ----- | ------------------------------------------------- |
| Enter | In a field, submits the form, as in a native one. |

## Resetting

A reset, from a `<button type="reset">` or `reset()`, puts each control back
to the value it started with, as it does a native one. That's its `value`
attribute, or `checked` on a Checkbox, Switch or Radio, and `selected` on an
Option. Read or change it from code with `defaultValue`, `defaultChecked` or
`defaultSelected`, just like a native input's. Range Slider and Date Range
Field have `defaultStartValue` and `defaultEndValue`.

```js
const field = document.querySelector('slab-text-field');

field.defaultValue = '14 Alder Lane foundation';
field.form.reset();
```

## Labels

Each control has `labels`, as a native one does: the `<label>` elements
associated with it, by a `for` that names its `id` or by being around it.
Slab's controls are named by their own `label` attribute, so it's often
empty.

Clicking one of those labels does what it does for a native control. A
Checkbox or Switch toggles, a File Drop opens its file picker, and any other
control takes focus. The label doesn't name the control, though, so keep its
`label` attribute.

```js
const field = document.querySelector('slab-text-field');

for (const label of field.labels) {
  label.classList.add('is-labelling');
}
```
