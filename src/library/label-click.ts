// The control the label last clicked labels, from the time the label's click
// is dispatched until the label passes it on, or doesn't.
let labelledControl: Element | null = null;

let isListening = false;

// Clicks are composed, so a capture listener on the document hears one on any
// label, including a label in a shadow root, and before anything on the way
// down can stop it.
function onDocumentClick(event: Event) {
  const path = event.composedPath();

  // The click the label passes on, which comes through here too.
  if (labelledControl && path[0] === labelledControl) {
    return;
  }

  const label = path.find((target) => target instanceof HTMLLabelElement);

  labelledControl = label?.control ?? null;

  // A label passes its click on synchronously, once its own dispatch is
  // done, so the next task is too late for one to arrive. It doesn't pass it
  // on when its click is canceled, or comes from interactive content inside
  // it, and this keeps a later scripted click on the control from being
  // taken for the label's.
  setTimeout(() => {
    labelledControl = null;
  });
}

/**
 * Makes a form control do what a native one does when one of its outside
 * labels is clicked, whether that's a `<label for>` or a `<label>` wrapped
 * around it.
 *
 * A label passes its click on to its control, and a form-associated host is
 * the control. But the native control behind it is in its shadow root, so
 * nothing focuses it or checks it unless the host does. A host whose shadow
 * root delegates focus is already focused by then, the browser having
 * focused it as a native label would.
 *
 * Only the label's click counts. A scripted `click()` or a click inside the
 * shadow root is the host's own to handle, as it already does. And a label
 * passes no click on to a disabled control, so a disabled one does nothing.
 */
export default function handleLabelClicks(
  host: HTMLElement,
  activate: () => void = () => {
    host.focus();
  },
) {
  if (!isListening) {
    document.addEventListener('click', onDocumentClick, { capture: true });
    isListening = true;
  }

  host.addEventListener('click', (event) => {
    if (event.composedPath()[0] === host && labelledControl === host) {
      labelledControl = null;
      activate();
    }
  });
}
