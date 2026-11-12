/**
 * Throws as a native input's `showPicker()` does before it shows a picker:
 * an "InvalidStateError" when the control can't change, because it's disabled
 * or read-only, and a "NotAllowedError" without a user gesture, such as a
 * click or a key press, just before.
 */
export default function assertCanShowPicker({
  isMutable,
}: {
  isMutable: boolean;
}): void {
  if (!isMutable) {
    throw new DOMException(
      "It's disabled or read-only, so its picker can't be shown.",
      'InvalidStateError',
    );
  }

  if (!navigator.userActivation.isActive) {
    throw new DOMException(
      'Its picker can only be shown from a user gesture, such as a click.',
      'NotAllowedError',
    );
  }
}
