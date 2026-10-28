// Announces a change that has no element of its own to announce it from, such
// as how many Options a Combobox's filter left, or a tag that's gone.
//
// A live region only announces what's inserted into it after screenreaders
// have found it, so the regions are made once, on the first announcement, and
// the message goes in a moment later. Each message is its own element, added
// and later removed, so the same message twice is announced twice and an old
// one isn't left to be read again by someone moving through the page.
//
// The regions are found under a registered symbol on the element that holds
// them, rather than kept in this module, so more than one copy of this module
// on a page shares them.
//
// Outside a modal dialog, everything is inert, and inert content isn't
// announced. So when `source` is in an open modal dialog, the regions go
// inside that dialog instead of the body.

const key = Symbol.for('slab.announcer');

// Long enough to be read, short enough not to be found again later.
const lifetime = 7000;

// Long enough for screenreaders to have found a region that was just made.
const delay = 100;

type Politeness = 'assertive' | 'polite';

type Regions = Record<Politeness, HTMLElement>;

type Holder = Element & { [key]?: Regions };

export interface AnnounceOptions {
  /**
   * "assertive" interrupts what's being read, so it's for errors.
   */
  politeness?: Politeness;

  /**
   * What the announcement is about, which decides whether the regions belong
   * in a modal dialog.
   */
  source?: Element;
}

// Through shadow roots, since a Dialog's `<dialog>` is in its own.
function closestModalDialog(element: Element | undefined): Element | null {
  let node: Element | undefined = element;

  while (node) {
    const dialog = node.closest('dialog');

    if (dialog?.matches(':modal')) {
      return dialog;
    }

    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : undefined;
  }

  return null;
}

function makeRegion(politeness: Politeness) {
  const region = document.createElement('div');

  region.dataset.slabAnnouncer = politeness;
  region.setAttribute('aria-live', politeness);
  region.setAttribute('aria-relevant', 'additions');

  // Visually hidden, where screenreaders still find it. Inline, because
  // there's no shadow root here to carry styles.
  region.style.cssText = [
    'block-size: 1px',
    'border-width: 0',
    'clip: rect(0, 0, 0, 0)',
    'inline-size: 1px',
    'margin: -1px',
    'overflow: hidden',
    'padding: 0',
    'position: absolute',
    'white-space: nowrap',
  ].join('; ');

  return region;
}

function regionsIn(holder: Holder): { isNew: boolean; regions: Regions } {
  const existing = holder[key];

  if (existing?.polite.isConnected) {
    return { isNew: false, regions: existing };
  }

  const regions = {
    assertive: makeRegion('assertive'),
    polite: makeRegion('polite'),
  };

  holder.append(regions.polite, regions.assertive);
  holder[key] = regions;

  return { isNew: true, regions };
}

export default function announce(
  message: string,
  { politeness = 'polite', source }: AnnounceOptions = {},
): void {
  if (message.trim() === '') {
    return;
  }

  const holder = closestModalDialog(source) ?? document.body;
  const { isNew, regions } = regionsIn(holder);
  const region = regions[politeness];

  const entry = document.createElement('div');
  entry.textContent = message;

  // A region that was just made needs a moment before it's listened to.
  setTimeout(
    () => {
      region.append(entry);

      setTimeout(() => {
        entry.remove();
      }, lifetime);
    },
    isNew ? delay : 0,
  );
}
