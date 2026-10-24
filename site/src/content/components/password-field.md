---
title: Password Field
group: Form
element: '<input type=password>'
tags: [slab-password-field]
summary: 'A password input with a button that shows and hides what was typed.'
example: |
  <slab-styled-password-field label="Site gate code" autocomplete="current-password" minlength="8" required>
    <span slot="description">At least 8 characters. Press Show password to check it.</span>
  </slab-styled-password-field>
usage: |
  <slab-password-field label="Password" name="password" autocomplete="current-password" required></slab-password-field>
---

The button is a toggle button, so its name stays "Show password" (or your `toggle-label`) and `aria-pressed` says whether the password shows. A screenreader reads "Show password, toggle button, pressed" instead of a name that changes under the user. While it shows, the input is a text input, with spellcheck, autocorrect and autocapitalize off so the password doesn't go to a spellchecker.

`revealed` works like `value`: the attribute sets the starting state and the property tracks the current one. Resetting the form hides the password again. Edge's own reveal button is hidden so there's only one. Set `autocomplete` to "current-password" on a sign-in form or "new-password" where a password is chosen, so password managers fill and save it.

## Keyboard

| Key            | What it does                                              |
| -------------- | --------------------------------------------------------- |
| Tab, Shift+Tab | Moves from the input to the button, and out of the field. |
| Space, Enter   | On the button, shows or hides the password.               |
| Enter          | In the input, submits the form.                           |
| Anything else  | What it does on a native password input.                  |
