// Formats a number for a locale and a set of `Intl.NumberFormat` options, and
// parses what a person types back into one. `Intl` formats but can't parse, so
// the parser learns the locale's symbols from the formatter's own parts: its
// digits, its decimal and group separators, its minus sign, and every currency
// symbol, unit, percent sign and literal it writes around a number. Typed text
// is a number once those are taken out, and the decimal separator is read as
// a decimal point.
//
// It reads standard notation. Scientific, engineering and compact notation
// format, but their exponents and suffixes, like "K", aren't parsed.

// Numbers whose parts cover what a format writes around a number: negative
// and positive, singular and plural, with and without a fraction, and big
// enough to be grouped. Plural forms matter for a currency or a unit written
// out, like "1 US dollar" and "2 US dollars".
const samples = [-11_111.11, 11_111.11, -1, 0, 1, 2, 0.5, 5, 12];

// What people type for a minus sign, beside the locale's own.
const minusSigns = ['-', '−', '‒', '–', '—', '﹣', '－'];

// Group separators people type for one they can't, such as the narrow
// no-break space in French or the right single quotation mark in Swiss German.
const groupLookalikes: Record<string, string[]> = {
  '’': ["'"],
  '\u{A0}': [' '],
  '\u{202F}': [' ', '\u{A0}'],
};

function escape(text: string) {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

export default class NumberFormat {
  /** The options the formatter resolved, such as the fraction digits. */
  get resolvedOptions(): Intl.ResolvedNumberFormatOptions {
    return this.#formatter.resolvedOptions();
  }

  format(value: number): string {
    return this.#formatter.format(value);
  }

  /** The number typed, or `NaN` when it isn't one. */
  parse(text: string): number {
    let number = text.normalize('NFKC');

    // A negative number in parentheses, as `currencySign: "accounting"`
    // writes one.
    const isParenthesized =
      this.#isParenthesizedNegative && /^\s*\(.*\)\s*$/.test(number);

    for (const [index, digit] of this.#digits.entries()) {
      if (digit !== String(index)) {
        number = number.replaceAll(digit, String(index));
      }
    }

    // Longest first, so "US dollars" goes before "US dollar" would leave an
    // "s".
    for (const affix of this.#affixes) {
      number = number.replaceAll(affix, '');
    }

    number = number.replaceAll(/[\s()]/g, '');

    for (const group of this.#groups) {
      number = number.replaceAll(group, '');
    }

    let isNegative = isParenthesized;

    const sign = new RegExp(
      `^(${[...this.#minusSigns, '+'].map((sign) => escape(sign)).join('|')})`,
    ).exec(number);

    if (sign) {
      isNegative = sign[1] !== '+';
      number = number.slice(sign[1]?.length);
    }

    number = number.replace(this.#decimal, '.');

    if (!/^(\d+\.?\d*|\.\d+)$/.test(number)) {
      return NaN;
    }

    let value = Number(number) * (isNegative ? -1 : 1);

    // A percent is a fraction of 1, as `Intl` formats one, so "12%" is 0.12.
    // Rounded so the division doesn't leave 0.12300000000000001 behind.
    if (this.#isPercent) {
      value = Number((value / 100).toPrecision(15));
    }

    // Negative zero is zero.
    return value + 0;
  }

  constructor(locale: string | undefined, options?: Intl.NumberFormatOptions) {
    this.#formatter = new Intl.NumberFormat(locale, options);

    const { style } = this.#formatter.resolvedOptions();
    this.#isPercent = style === 'percent';

    const digitFormatter = new Intl.NumberFormat(locale, {
      useGrouping: false,
    });

    // The locale's own digits, such as Arabic-Indic ones, by their value.
    this.#digits = Array.from({ length: 10 }, (_, digit) =>
      digitFormatter.format(digit),
    );

    const affixes = new Set<string>();
    const groups = new Set<string>();

    // From a format that always has a fraction, since one like a percent's
    // may never write a decimal separator. A fraction always has one, so the
    // fallback is never used.
    /* v8 ignore next 3 */
    const decimal =
      digitFormatter.formatToParts(1.1).find((part) => part.type === 'decimal')
        ?.value ?? '.';

    const minus = new Set(minusSigns);

    for (const sample of samples) {
      for (const part of this.#formatter.formatToParts(sample)) {
        switch (part.type) {
          case 'currency':
          case 'literal':
          case 'percentSign':
          case 'unit': {
            if (part.value.trim()) {
              affixes.add(part.value.trim().normalize('NFKC'));
            }

            break;
          }
          case 'group': {
            groups.add(part.value);

            for (const lookalike of groupLookalikes[part.value] ?? []) {
              groups.add(lookalike);
            }

            break;
          }
          case 'minusSign': {
            minus.add(part.value);

            break;
          }
        }
      }
    }

    this.#isParenthesizedNegative = this.#formatter
      .formatToParts(-1)
      .some((part) => part.value.includes('('));

    // A typed point is a decimal point unless the locale groups with one.
    this.#decimal = groups.has('.')
      ? decimal
      : new RegExp(String.raw`${escape(decimal)}|\.`);

    this.#groups = [...groups].filter((group) => group !== decimal);

    this.#affixes = [...affixes]
      .filter((affix) => !/^[()]+$/.test(affix))
      .toSorted((a, b) => b.length - a.length);

    this.#minusSigns = [...minus];
  }

  #affixes: string[];

  #decimal: RegExp | string;

  #digits: string[];

  #formatter: Intl.NumberFormat;

  #groups: string[];

  #isParenthesizedNegative: boolean;

  #isPercent: boolean;

  #minusSigns: string[];
}
