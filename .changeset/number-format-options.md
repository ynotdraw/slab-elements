---
'slab-elements': minor
---

Number has a `format-options` attribute, and a `formatOptions` property, that take `Intl.NumberFormat` options for a currency, a percent or a unit, such as `format-options='{"style":"currency","currency":"USD"}'`. The field shows its value formatted in the language of the nearest `lang`, and reads what's typed, such as "$1,234.50" or "12 %", back into a number. `value` and the submitted value stay a plain number, and a percent's is a fraction, as `Intl` formats one, so 0.12 shows as 12%. Text that isn't a number is `badInput`, with the message "Enter a number.", which `registerStrings()` translates as `numberBadInput`. Without `format-options`, Number is the native number input it was.
