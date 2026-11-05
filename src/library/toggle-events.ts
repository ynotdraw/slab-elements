/**
 * Works out the "toggle" an element that opens and closes should dispatch:
 * whenever its `open` has changed since the last time it was given one. It's
 * given the settled `open` at the end of each update, so it doesn't matter
 * whether `open` was set, a method was called, or the platform closed a
 * popover, and a change made and undone within one update is no change.
 *
 * The first `open` it's given is where it starts, so an element rendered open
 * doesn't dispatch.
 *
 * The element dispatches the event itself, so the elements manifest sees it.
 * Like a popover's own "toggle", it doesn't bubble and isn't composed.
 */
export default class ToggleEvents {
  update(isOpen: boolean): ToggleEventInit | undefined {
    const wasOpen = this.#isOpen;

    this.#isOpen = isOpen;

    if (wasOpen !== undefined && wasOpen !== isOpen) {
      return {
        newState: isOpen ? 'open' : 'closed',
        oldState: wasOpen ? 'open' : 'closed',
      };
    }
  }

  #isOpen?: boolean;
}
