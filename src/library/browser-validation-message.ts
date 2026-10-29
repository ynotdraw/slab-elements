type Kind = 'check' | 'choose' | 'fill' | 'match' | 'select';

// Made once and kept. A message only changes with the browser's language,
// which takes a reload.
const messages = new Map<Kind, string>();

const types = { check: 'checkbox', choose: 'radio', fill: 'text' } as const;

function createControl(kind: Kind): HTMLInputElement | HTMLSelectElement {
  if (kind === 'select') {
    const select = document.createElement('select');
    select.required = true;

    return select;
  }

  const input = document.createElement('input');

  if (kind === 'match') {
    input.pattern = 'a';
    input.value = 'b';

    return input;
  }

  // A radio without a name isn't in a group, and isn't missing a value.
  input.name = 'slab';
  input.type = types[kind];
  input.required = true;

  return input;
}

/**
 * The browser's own validation message, in the browser's language, for a
 * component whose validity Slab works out rather than a native control in its
 * shadow root, such as a Listbox or a Radio Group. Each is what a native
 * control says about the same problem:
 *
 * - "check": a required checkbox that isn't checked
 * - "choose": required radios with none checked
 * - "fill": a required text input that's empty
 * - "match": a text input that doesn't match its `pattern`
 * - "select": a required `<select>` with nothing selected
 *
 * The control it's read from is never put on the page.
 */
export default function browserValidationMessage(kind: Kind): string {
  let message = messages.get(kind);

  if (message === undefined) {
    // A space if the browser has nothing to say, since a validity that's
    // invalid has to have a message. It's trimmed before it's shown.
    /* v8 ignore next */
    message = createControl(kind).validationMessage || ' ';
    messages.set(kind, message);
  }

  return message;
}
