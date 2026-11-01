import type { ReactiveController, ReactiveControllerHost } from 'lit';

// The words Slab's elements say on their own, such as a dismiss button's or a
// page button's name. Each one an element shows can also be set on the
// element, through an attribute or a property, which wins over these.
//
// English is built in. Other languages are registered with `registerStrings()`
// from "slab-elements/strings.js", and an element picks the table for the
// nearest `lang`, the way Calendar picks its `Intl` locale: "fr-CA" first,
// then "fr", then English. A registered table can leave strings out, and those
// are the next table's.
export interface Strings {
  alertDismiss: string;
  breadcrumb: string;
  calendarNextMonth: string;
  calendarPreviousMonth: string;
  calendarRangeSelected: (range: string) => string;
  calendarRangeStarted: (date: string) => string;
  carouselMarker: (index: number) => string;
  carouselNext: string;
  carouselPrevious: string;
  carouselSlide: (index: number, total: number) => string;
  carouselSlideRole: string;
  carouselStart: string;
  carouselStop: string;
  colorPickerAlpha: string;
  colorPickerArea: string;
  colorPickerBrightness: string;
  colorPickerHex: string;
  colorPickerHue: string;
  colorPickerSaturation: string;
  colorPickerSwatches: string;
  comboboxRemove: (text: string) => string;
  comboboxRemoved: (text: string) => string;
  comboboxResults: (count: number) => string;
  commandPaletteResults: (count: number) => string;
  copyButtonCopied: string;
  copyButtonFailed: string;
  dateRangeFieldEnd: string;
  dateRangeFieldStart: string;
  fileDropAdded: (count: number) => string;
  fileDropNotAccepted: (count: number) => string;
  fileDropTooMany: string;
  pagination: string;
  paginationNext: string;
  paginationPage: (page: number) => string;
  paginationPrevious: string;
  passwordFieldShow: string;
  pinInputCharacter: (position: number, length: number) => string;
  rangeSliderMaximum: string;
  rangeSliderMinimum: string;
  stepsComplete: string;
  tagsInputAdded: (text: string) => string;
  tagsInputRemove: (text: string) => string;
  tagsInputRemoved: (text: string) => string;
}

const english: Strings = {
  alertDismiss: 'Dismiss',
  breadcrumb: 'Breadcrumb',
  calendarNextMonth: 'Next month',
  calendarPreviousMonth: 'Previous month',
  calendarRangeSelected: (range) => `${range} selected`,
  calendarRangeStarted: (date) => `${date} starts the range. Pick its end.`,
  carouselMarker: (index) => `Slide ${index + 1}`,
  carouselNext: 'Next slide',
  carouselPrevious: 'Previous slide',
  carouselSlide: (index, total) => `${index + 1} of ${total}`,
  carouselSlideRole: 'slide',
  carouselStart: 'Start slide rotation',
  carouselStop: 'Stop slide rotation',
  colorPickerAlpha: 'Alpha',
  colorPickerArea: 'Saturation and brightness',
  colorPickerBrightness: 'Brightness',
  colorPickerHex: 'Hex',
  colorPickerHue: 'Hue',
  colorPickerSaturation: 'Saturation',
  colorPickerSwatches: 'Swatches',
  comboboxRemove: (text) => `Remove ${text}`,
  comboboxRemoved: (text) => `${text} removed`,
  comboboxResults: (count) =>
    count === 0 ? 'No results' : count === 1 ? '1 result' : `${count} results`,
  commandPaletteResults: (count) =>
    count === 0 ? 'No results' : count === 1 ? '1 result' : `${count} results`,
  copyButtonCopied: 'Copied',
  copyButtonFailed: "Couldn't copy",
  dateRangeFieldEnd: 'End',
  dateRangeFieldStart: 'Start',
  fileDropAdded: (count) =>
    count === 1 ? '1 file added' : `${count} files added`,
  fileDropNotAccepted: (count) =>
    count === 1
      ? "1 file isn't an accepted type"
      : `${count} files aren't an accepted type`,
  fileDropTooMany: 'Only one file can be added',
  pagination: 'Pagination',
  paginationNext: 'Next',
  paginationPage: (page) => `Page ${page}`,
  paginationPrevious: 'Previous',
  passwordFieldShow: 'Show password',
  pinInputCharacter: (position, length) => `Character ${position} of ${length}`,
  rangeSliderMaximum: 'Maximum',
  rangeSliderMinimum: 'Minimum',
  stepsComplete: 'Completed',
  tagsInputAdded: (text) => `${text} added`,
  tagsInputRemove: (text) => `Remove ${text}`,
  tagsInputRemoved: (text) => `${text} removed`,
};

// Kept under a registered symbol rather than in this module, so more than one
// copy of Slab on a page shares the tables registered with any of them.
const key = Symbol.for('slab.strings');

type Tables = Map<string, Partial<Strings>>;

function tables(): Tables {
  const holder = globalThis as { [key]?: Tables };

  holder[key] ??= new Map();

  return holder[key];
}

/**
 * Adds strings for a language, such as "fr" or "fr-CA", to any already
 * registered for it. Elements whose nearest `lang` is that language use them,
 * and English for any left out.
 */
export function registerStrings(lang: string, strings: Partial<Strings>) {
  const name = lang.toLowerCase();

  tables().set(name, { ...tables().get(name), ...strings });
  // So elements already on the page take it up.
  globalThis.dispatchEvent(new Event('slab-strings-change'));
}

// The nearest `lang`, through shadow roots, since an element in one can't see
// the page's with `closest()` alone.
function langOf(element: Element) {
  let node: Element | undefined = element;

  while (node) {
    const lang = node.closest('[lang]:not([lang=""])')?.getAttribute('lang');

    if (lang) {
      return lang.toLowerCase();
    }

    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : undefined;
  }

  return '';
}

/** The strings for an element, from the table for its nearest `lang`. */
export function stringsFor(element: Element): Strings {
  const lang = langOf(element);
  const [language] = lang.split('-');

  return {
    ...english,
    ...tables().get(String(language)),
    ...tables().get(lang),
  };
}

/**
 * Gives its host the strings for its nearest `lang`, and renders it again when
 * a table is registered.
 */
export default class StringsController implements ReactiveController {
  get value(): Strings {
    return stringsFor(this.#host);
  }

  hostConnected() {
    globalThis.addEventListener('slab-strings-change', this.#onChange);
  }

  hostDisconnected() {
    globalThis.removeEventListener('slab-strings-change', this.#onChange);
  }

  constructor(host: ReactiveControllerHost & Element) {
    this.#host = host;
    host.addController(this);
  }

  #host: ReactiveControllerHost & Element;

  #onChange = () => {
    this.#host.requestUpdate();
  };
}
