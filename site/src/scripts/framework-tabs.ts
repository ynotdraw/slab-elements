// On a narrow screen the framework tabs are one row that scrolls sideways. A
// "‹" or "›" button shows at either end while there are more tabs that way,
// since a row that scrolls doesn't look like one. They're for a pointer: the
// arrow keys already move through the tabs, and scroll the one they focus
// into view, so the buttons are left out of the Tab order and the
// accessibility tree.

function button(side: 'end' | 'start') {
  const element = document.createElement('button');

  element.ariaHidden = 'true';
  element.className = `frameworks-scroll-button frameworks-scroll-${side}`;
  element.hidden = true;
  element.tabIndex = -1;
  element.textContent = side === 'start' ? '‹' : '›';
  element.type = 'button';

  return element;
}

export async function addScrollButtons(tabs: HTMLElement) {
  // A wrapper rather than buttons inside, since Tabs takes only tabs and
  // panels. It's added before Tabs is defined, so Tabs isn't moved after.
  const wrapper = document.createElement('div');
  const start = button('start');
  const end = button('end');

  wrapper.className = 'frameworks-scroll';
  tabs.before(wrapper);
  wrapper.append(start, tabs, end);

  await customElements.whenDefined('slab-tabs');
  await (tabs as HTMLElement & { updateComplete: Promise<boolean> })
    .updateComplete;

  const tablist =
    tabs.shadowRoot?.querySelector<HTMLElement>('[part~="tablist"]');

  if (!tablist) {
    return;
  }

  function update() {
    if (!tablist) {
      return;
    }

    const { clientWidth, scrollLeft, scrollWidth } = tablist;

    start.hidden = scrollLeft <= 1;
    end.hidden = scrollLeft + clientWidth >= scrollWidth - 1;

    wrapper.style.setProperty(
      '--frameworks-tab-block-size',
      `${tablist.clientHeight}px`,
    );
  }

  function scrollBy(direction: -1 | 1) {
    tablist?.scrollBy({
      behavior: 'smooth',
      left: direction * tablist.clientWidth * 0.6,
    });
  }

  start.addEventListener('click', () => scrollBy(-1));
  end.addEventListener('click', () => scrollBy(1));
  tablist.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(tablist);
  update();
}
