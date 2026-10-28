/**
 * Whether a key belongs to an input method that's composing text, such as one
 * for Japanese or Chinese, rather than to the field. An input method uses
 * Enter to confirm what's been composed, Escape to abandon it, and the arrows
 * to move through its candidates, so a field acts on none of them meanwhile.
 *
 * Safari sends the Enter that ends a composition with `isComposing` false,
 * after "compositionend". Its `keyCode` is still 229, which every browser
 * gives a key an input method has handled.
 */
export default function isComposing(event: KeyboardEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}
