// "invalid" events that something other than the control cancelled.
const cancelled = new WeakSet<Event>();

/**
 * Cancels an "invalid" event, so the browser shows no validation bubble of its
 * own. A control cancels every one, so `defaultPrevented` can't say whether a
 * consumer cancelled it too. This keeps track of that instead, for
 * `isInvalidCancelled()`.
 */
export function preventValidationBubble(event: Event): void {
  const preventDefault = event.preventDefault.bind(event);

  event.preventDefault = () => {
    cancelled.add(event);
    preventDefault();
  };

  preventDefault();
}

/**
 * Whether something other than the control cancelled an "invalid" event, which
 * keeps its validity message unshown, as cancelling one does a native
 * control's validation bubble.
 */
export function isInvalidCancelled(event: Event): boolean {
  return cancelled.has(event);
}
