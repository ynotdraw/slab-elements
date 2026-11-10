/**
 * Runs a callback just before a host's "input" and "change" reach anyone
 * else's listeners, so what those listeners read is already current.
 *
 * A native control's value, validity and form data have all changed by the
 * time its "input" is dispatched. A component's would otherwise trail by an
 * update: its form value and validity are set from `updated()`, and a group
 * hears of its children's changes from theirs, all after the event has been
 * and gone. So `new FormData(form)` in a form's "input" listener would have
 * the value from before.
 *
 * The listeners capture, so they run ahead of a listener on the host, however
 * early it was added, and ahead of one on a child the event came from.
 */
export default function beforeEvents(
  host: HTMLElement,
  callback: (event: Event) => void,
) {
  host.addEventListener('input', callback, { capture: true });
  host.addEventListener('change', callback, { capture: true });
}
