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

<slab-tabs class="frameworks-tabs" label="Framework">
<slab-tabs-tab panel="React">React</slab-tabs-tab>
<slab-tabs-tab panel="Lit">Lit</slab-tabs-tab>
<slab-tabs-tab panel="Vue">Vue</slab-tabs-tab>
<slab-tabs-tab panel="Svelte">Svelte</slab-tabs-tab>
<slab-tabs-tab panel="HTML">HTML</slab-tabs-tab>

<slab-tabs-panel name="React">

```jsx
export function JobName() {
  return (
    <slab-text-field label="Job name" name="job" required>
      <span slot="validity-message">
        Give the job a name so the crew can find it.
      </span>
    </slab-text-field>
  );
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Lit">

```ts
render() {
  return html`
    <slab-text-field label="Job name" name="job" required>
      <span slot="validity-message">
        Give the job a name so the crew can find it.
      </span>
    </slab-text-field>
  `;
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Vue">

```vue
<template>
  <slab-text-field label="Job name" name="job" required>
    <span slot="validity-message">
      Give the job a name so the crew can find it.
    </span>
  </slab-text-field>
</template>
```

</slab-tabs-panel>

<slab-tabs-panel name="Svelte">

```svelte
<slab-text-field label="Job name" name="job" required>
  <span slot="validity-message">
    Give the job a name so the crew can find it.
  </span>
</slab-text-field>
```

</slab-tabs-panel>

<slab-tabs-panel name="HTML">

```html
<slab-text-field label="Job name" name="job" required>
  <span slot="validity-message">
    Give the job a name so the crew can find it.
  </span>
</slab-text-field>
```

</slab-tabs-panel>

</slab-tabs>

It's markup, so a link works too. `validationMessage` stays the browser's
message, or the one you set.

### A different message for each problem

The slot shows the same thing whatever went wrong. Can a field fail more than
one way? Pick the words on "invalid", which fires just before the message
shows. `validity` says what's wrong.

<slab-tabs class="frameworks-tabs" label="Framework">
<slab-tabs-tab panel="React">React</slab-tabs-tab>
<slab-tabs-tab panel="Lit">Lit</slab-tabs-tab>
<slab-tabs-tab panel="Vue">Vue</slab-tabs-tab>
<slab-tabs-tab panel="Svelte">Svelte</slab-tabs-tab>
<slab-tabs-tab panel="HTML">HTML</slab-tabs-tab>

<slab-tabs-panel name="React">

```jsx
import { useEffect, useRef, useState } from 'react';

export function Email() {
  const field = useRef(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const element = field.current;

    function onInvalid() {
      setMessage(
        element.validity.valueMissing
          ? 'Enter an email so we can send the schedule.'
          : "That doesn't look like an email. Check for typos?",
      );
    }

    element.addEventListener('invalid', onInvalid);

    return () => element.removeEventListener('invalid', onInvalid);
  }, []);

  return (
    <slab-text-field
      label="Email"
      name="email"
      ref={field}
      required
      type="email"
    >
      <span slot="validity-message">{message}</span>
    </slab-text-field>
  );
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Lit">

```ts
@state()
private message = '';

#onInvalid(event: Event) {
  const field = event.target as HTMLElementTagNameMap['slab-text-field'];

  this.message = field.validity.valueMissing
    ? 'Enter an email so we can send the schedule.'
    : "That doesn't look like an email. Check for typos?";
}

render() {
  return html`
    <slab-text-field
      label="Email"
      name="email"
      required
      type="email"
      @invalid=${this.#onInvalid}
    >
      <span slot="validity-message">${this.message}</span>
    </slab-text-field>
  `;
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Vue">

```vue
<script setup>
import { ref } from 'vue';

const message = ref('');

function onInvalid(event) {
  message.value = event.target.validity.valueMissing
    ? 'Enter an email so we can send the schedule.'
    : "That doesn't look like an email. Check for typos?";
}
</script>

<template>
  <slab-text-field
    label="Email"
    name="email"
    required
    type="email"
    @invalid="onInvalid"
  >
    <span slot="validity-message">{{ message }}</span>
  </slab-text-field>
</template>
```

</slab-tabs-panel>

<slab-tabs-panel name="Svelte">

```svelte
<script>
  let message = $state('');

  function oninvalid(event) {
    message = event.target.validity.valueMissing
      ? 'Enter an email so we can send the schedule.'
      : "That doesn't look like an email. Check for typos?";
  }
</script>

<slab-text-field label="Email" name="email" required type="email" {oninvalid}>
  <span slot="validity-message">{message}</span>
</slab-text-field>
```

</slab-tabs-panel>

<slab-tabs-panel name="HTML">

```js
const field = document.querySelector('slab-text-field[name="email"]');
const message = field.querySelector('[slot="validity-message"]');

field.addEventListener('invalid', () => {
  message.textContent = field.validity.valueMissing
    ? 'Enter an email so we can send the schedule.'
    : "That doesn't look like an email. Check for typos?";
});
```

</slab-tabs-panel>

</slab-tabs>

### Errors from your server

Some errors only your server knows about, like an email that's already
taken. Put the message in `custom-validity`. It's `setCustomValidity()` from
markup: the control is invalid with that message, and it shows right away,
without waiting for a blur or a submit.

The error stays until you take it away, just like `setCustomValidity()`, and
it stops the form from submitting. Clear it once the user changes the value.
An empty string, or no attribute at all, makes the control valid again.

<slab-tabs class="frameworks-tabs" label="Framework">
<slab-tabs-tab panel="React">React</slab-tabs-tab>
<slab-tabs-tab panel="Lit">Lit</slab-tabs-tab>
<slab-tabs-tab panel="Vue">Vue</slab-tabs-tab>
<slab-tabs-tab panel="Svelte">Svelte</slab-tabs-tab>
<slab-tabs-tab panel="HTML">HTML</slab-tabs-tab>

<slab-tabs-panel name="React">

```jsx
import { useState } from 'react';

// `error` is what your server said, such as "That email is already taken".
export function Email({ error: serverError }) {
  const [error, setError] = useState(serverError);

  return (
    <slab-text-field
      custom-validity={error}
      label="Email"
      name="email"
      onInput={() => setError('')}
      type="email"
    ></slab-text-field>
  );
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Lit">

```ts
// What your server said, such as "That email is already taken".
@property()
error = '';

render() {
  return html`
    <slab-text-field
      custom-validity=${this.error}
      label="Email"
      name="email"
      type="email"
      @input=${() => (this.error = '')}
    ></slab-text-field>
  `;
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Vue">

```vue
<script setup>
import { ref } from 'vue';

// What your server said, such as "That email is already taken".
const props = defineProps({ error: String });
const error = ref(props.error);
</script>

<template>
  <slab-text-field
    :custom-validity="error"
    label="Email"
    name="email"
    type="email"
    @input="error = ''"
  ></slab-text-field>
</template>
```

</slab-tabs-panel>

<slab-tabs-panel name="Svelte">

```svelte
<script>
  // What your server said, such as "That email is already taken".
  let { error: serverError } = $props();
  let error = $state(serverError);
</script>

<slab-text-field
  custom-validity={error}
  label="Email"
  name="email"
  oninput={() => (error = '')}
  type="email"
></slab-text-field>
```

</slab-tabs-panel>

<slab-tabs-panel name="HTML">

```html
<slab-text-field
  custom-validity="That email is already taken"
  label="Email"
  name="email"
  type="email"
></slab-text-field>

<script type="module">
  const field = document.querySelector('slab-text-field[name="email"]');

  field.addEventListener('input', () => {
    field.removeAttribute('custom-validity');
  });
</script>
```

</slab-tabs-panel>

</slab-tabs>

### Rules of your own

For a rule only your page knows, like two passwords that have to match, call
`setCustomValidity()` whenever the value changes. An empty string makes it
valid again.

<slab-tabs class="frameworks-tabs" label="Framework">
<slab-tabs-tab panel="React">React</slab-tabs-tab>
<slab-tabs-tab panel="Lit">Lit</slab-tabs-tab>
<slab-tabs-tab panel="Vue">Vue</slab-tabs-tab>
<slab-tabs-tab panel="Svelte">Svelte</slab-tabs-tab>
<slab-tabs-tab panel="HTML">HTML</slab-tabs-tab>

<slab-tabs-panel name="React">

```jsx
import { useRef } from 'react';

export function Passwords() {
  const password = useRef(null);
  const confirm = useRef(null);

  function onInput() {
    confirm.current.setCustomValidity(
      confirm.current.value === password.current.value
        ? ''
        : "The passwords don't match.",
    );
  }

  return (
    <>
      <slab-password-field
        label="Password"
        name="password"
        onInput={onInput}
        ref={password}
      />
      <slab-password-field
        label="Confirm password"
        name="confirm"
        onInput={onInput}
        ref={confirm}
      />
    </>
  );
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Lit">

```ts
@query('[name="password"]')
private password?: HTMLElementTagNameMap['slab-password-field'];

@query('[name="confirm"]')
private confirm?: HTMLElementTagNameMap['slab-password-field'];

#onInput() {
  this.confirm?.setCustomValidity(
    this.confirm.value === this.password?.value
      ? ''
      : "The passwords don't match.",
  );
}

render() {
  return html`
    <slab-password-field label="Password" name="password" @input=${this.#onInput}></slab-password-field>
    <slab-password-field label="Confirm password" name="confirm" @input=${this.#onInput}></slab-password-field>
  `;
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Vue">

```vue
<script setup>
import { ref } from 'vue';

const password = ref(null);
const confirm = ref(null);

function onInput() {
  confirm.value.setCustomValidity(
    confirm.value.value === password.value.value
      ? ''
      : "The passwords don't match.",
  );
}
</script>

<template>
  <slab-password-field
    ref="password"
    label="Password"
    name="password"
    @input="onInput"
  ></slab-password-field>
  <slab-password-field
    ref="confirm"
    label="Confirm password"
    name="confirm"
    @input="onInput"
  ></slab-password-field>
</template>
```

</slab-tabs-panel>

<slab-tabs-panel name="Svelte">

```svelte
<script>
  let password = $state();
  let confirm = $state();

  function oninput() {
    confirm.setCustomValidity(
      confirm.value === password.value ? '' : "The passwords don't match.",
    );
  }
</script>

<slab-password-field bind:this={password} label="Password" name="password" {oninput}></slab-password-field>
<slab-password-field bind:this={confirm} label="Confirm password" name="confirm" {oninput}></slab-password-field>
```

</slab-tabs-panel>

<slab-tabs-panel name="HTML">

```js
const password = document.querySelector('[name="password"]');
const confirm = document.querySelector('[name="confirm"]');

function onInput() {
  confirm.setCustomValidity(
    confirm.value === password.value ? '' : "The passwords don't match.",
  );
}

password.addEventListener('input', onInput);
confirm.addEventListener('input', onInput);
```

</slab-tabs-panel>

</slab-tabs>

`setValidity()` does the same with the flags of your choice, as
`ElementInternals.setValidity()` does, when a rule should read as
`rangeUnderflow` or `patternMismatch` rather than `customError`.

### Keeping errors hidden

Would you rather show errors your own way, or only after a submit? Cancel
"invalid", as you would on a native control. The message stays hidden, the
control doesn't match `:state(error)`, and on a submit it isn't focused.
That goes for a blur, a submit and `reportValidity()` alike. The control is
still invalid, so `validity`, `:invalid` and a blocked submit work as usual.

<slab-tabs class="frameworks-tabs" label="Framework">
<slab-tabs-tab panel="React">React</slab-tabs-tab>
<slab-tabs-tab panel="Lit">Lit</slab-tabs-tab>
<slab-tabs-tab panel="Vue">Vue</slab-tabs-tab>
<slab-tabs-tab panel="Svelte">Svelte</slab-tabs-tab>
<slab-tabs-tab panel="HTML">HTML</slab-tabs-tab>

<slab-tabs-panel name="React">

```jsx
import { useEffect, useRef } from 'react';

export function Email() {
  const field = useRef(null);

  useEffect(() => {
    const element = field.current;
    const onInvalid = (event) => event.preventDefault();

    element.addEventListener('invalid', onInvalid);

    return () => element.removeEventListener('invalid', onInvalid);
  }, []);

  return (
    <slab-text-field
      label="Email"
      name="email"
      ref={field}
      required
      type="email"
    />
  );
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Lit">

```ts
render() {
  return html`
    <slab-text-field
      label="Email"
      name="email"
      required
      type="email"
      @invalid=${(event: Event) => event.preventDefault()}
    ></slab-text-field>
  `;
}
```

</slab-tabs-panel>

<slab-tabs-panel name="Vue">

```vue
<template>
  <slab-text-field
    label="Email"
    name="email"
    required
    type="email"
    @invalid.prevent
  ></slab-text-field>
</template>
```

</slab-tabs-panel>

<slab-tabs-panel name="Svelte">

```svelte
<slab-text-field
  label="Email"
  name="email"
  oninvalid={(event) => event.preventDefault()}
  required
  type="email"
></slab-text-field>
```

</slab-tabs-panel>

<slab-tabs-panel name="HTML">

```js
const field = document.querySelector('slab-text-field[name="email"]');

field.addEventListener('invalid', (event) => {
  event.preventDefault();
});
```

</slab-tabs-panel>

</slab-tabs>
