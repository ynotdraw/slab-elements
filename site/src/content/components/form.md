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

```js
const field = document.querySelector('slab-text-field');

for (const label of field.labels) {
  label.classList.add('is-labelling');
}
```

## Validation

Each control checks itself the way a native one does. A required field
that's empty is invalid, and so is one whose value breaks its `pattern`. You
don't have to write any of that yourself.

### When errors show

Nobody likes an error before they've had a chance to type. So a control's
validity message shows once its validity is reported:

- when focus leaves it
- when its form is submitted, which also focuses the first invalid control
- when you call `reportValidity()`

While it shows, the control has `aria-invalid`, the message is part of its
accessible description, and it matches `:state(error)`. Style the message
through `::part(validity-message)`.

`checkValidity()` asks without showing anything, on a control or a whole Form.
`resetValidityFeedback()` hides the message again, and a form reset does it
for you.

### Your own words

The browser's messages are generic, and they're in the browser's language,
not your page's. Slot your own into `validity-message`. You don't need to
make the control invalid yourself: the slot shows whenever it's invalid, for
any reason, and its message shows.

```html
<slab-text-field label="Job name" name="job" required>
  <span slot="validity-message"
    >Give the job a name so the crew can find it.</span
  >
</slab-text-field>
```

It's markup, so a link works too. `validationMessage` stays the browser's
message, or the one you set.

### A different message for each problem

The slot shows the same thing whatever went wrong. Can a field fail more than
one way? Change the slotted text on "invalid", which fires just before the
message shows. `validity` says what's wrong.

```js
const field = document.querySelector('slab-text-field[name="email"]');
const message = field.querySelector('[slot="validity-message"]');

field.addEventListener('invalid', () => {
  message.textContent = field.validity.valueMissing
    ? 'Enter an email so we can send the schedule.'
    : "That doesn't look like an email. Check for typos?";
});
```

### Errors from your server

Some errors only your server knows about, like an email that's already
taken. Put the message in `custom-validity`. It's `setCustomValidity()` from
markup: the control is invalid with that message, and it shows right away,
without waiting for a blur or a submit.

```html
<slab-text-field
  custom-validity="That email is already taken"
  label="Email"
  name="email"
  type="email"
></slab-text-field>
```

The error stays until you take it away, just like `setCustomValidity()`, and
it stops the form from submitting. Remove the attribute, or set it to an
empty string, once the user has changed the value:

```js
field.addEventListener('input', () => {
  field.removeAttribute('custom-validity');
});
```

In a framework, keep the error in your state, bind it to `custom-validity`,
and clear it on "input".

### Rules of your own

For a rule only your page knows, like two passwords that have to match, call
`setCustomValidity()` whenever the value changes. An empty string makes it
valid again.

```js
const password = document.querySelector('[name="password"]');
const confirm = document.querySelector('[name="confirm"]');

confirm.addEventListener('input', () => {
  confirm.setCustomValidity(
    confirm.value === password.value ? '' : "The passwords don't match.",
  );
});
```

`setValidity()` does the same with the flags of your choice, as
`ElementInternals.setValidity()` does, when a rule should read as
`rangeUnderflow` or `patternMismatch` rather than `customError`.
