---
title: Number
group: Form
element: '<input type=number>'
tags: [slab-number]
summary: 'A number field built on the native one, with stepping and validation included.'
example: |
  <div class="stack">
    <slab-styled-number label="Cubic yards" max="200" min="1" step="0.5" value="38">
      <span slot="description">Order about 10% over the slab's volume.</span>
    </slab-styled-number>

    <slab-styled-number format-options='{"style":"currency","currency":"USD"}' label="Price per yard" min="0" step="0.01" value="165">
      <span slot="description">Delivered, before the short-load fee.</span>
    </slab-styled-number>
  </div>
usage: |
  <slab-number label="Quantity" name="quantity" min="1" max="10" value="1"></slab-number>
---

## Currency, percent and unit

Set `format-options` to [`Intl.NumberFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options) as JSON, or the `formatOptions` property to the object, and the field shows its value formatted in the language of the nearest `lang`, such as "$1,234.50" or "1.234,50 €".

```html
<slab-number
  format-options='{"style":"currency","currency":"USD"}'
  label="Price"
  min="0"
  name="price"
  step="0.01"
  value="1234.5"
></slab-number>

<slab-number
  format-options='{"style":"percent"}'
  label="Discount"
  max="1"
  min="0"
  value="0.15"
></slab-number>

<slab-number
  format-options='{"style":"unit","unit":"kilometer-per-hour"}'
  label="Speed"
  min="0"
  value="88"
></slab-number>
```

`value` stays a plain number, and is what the form submits. The field reads what's typed back into one for its language, so "$1,234.50", "1234.5" and "1,234.5" are all 1234.5 in English, and "1.234,5 €" is in German. Once the value changes, it's rounded to the digits the format shows and formatted, so "1.239" becomes "$1.24". Text that isn't a number for the format is `badInput`, with an empty value, as on a number input. Its message is "Enter a number.", which `registerStrings()` translates as `numberBadInput`.

A percent's value is a fraction, as `Intl` formats one, so "15%" is 0.15, and `min`, `max` and `step` are fractions too. A percent steps by 0.01, or 1%, unless `step` says otherwise.

`min`, `max`, `step`, stepping and their validity are a number input's own, as they are without a format. The input is a text input with the `spinbutton` role, since a number input can't show a currency symbol or a unit, and screenreaders read the formatted value. It shows a decimal keypad on phones when `min` is 0 or more, and a full keyboard otherwise, since some decimal keypads have no minus sign. Standard notation is read back. Compact and scientific notation format, but "1.2K" and "1.2E3" aren't read as numbers.

## Keyboard

| Key      | What it does                           |
| -------- | -------------------------------------- |
| Up, Down | Steps the value, as on a number input. |
