/** @type { import('@storybook/web-components').Preview } */

import './overrides.css';
import {
  Controls,
  Description,
  DocsContainer,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
} from '@storybook/addon-docs/blocks';
import { GLOBALS_UPDATED } from '@storybook/core-events';
import { create } from '@storybook/theming';
import { createElement, Fragment, useEffect, useState } from 'react';

// The docs page's themes. The dark one's muted text clears AA, which
// Storybook's own dark theme misses at 4.4:1.
const documentationThemes = {
  light: create({ base: 'light', fontCode: 'monospace' }),
  dark: create({
    base: 'dark',
    appBg: '#1a1918',
    appContentBg: '#1a1918',
    appPreviewBg: '#1a1918',
    textColor: '#f4f1ec',
    textMutedColor: '#a8a19a',
    fontCode: 'monospace',
  }),
};

// Storybook themes the docs page once, from `parameters.docs.theme`, and
// re-renders only the stories when a global changes. So the container listens
// for the toolbar's theme itself, and the whole page follows it rather than
// just the stories on it.
function ThemedDocumentationContainer(properties) {
  const { channel, store } = properties.context;
  const [theme, setTheme] = useState(store.userGlobals.get().theme);

  useEffect(() => {
    const onGlobalsUpdated = ({ globals }) => {
      setTheme(globals.theme);
    };

    channel.on(GLOBALS_UPDATED, onGlobalsUpdated);

    return () => {
      channel.off(GLOBALS_UPDATED, onGlobalsUpdated);
    };
  }, [channel]);

  return createElement(DocsContainer, {
    ...properties,
    theme: documentationThemes[theme] ?? documentationThemes.light,
  });
}

// Storybook's own docs page, block for block, but with a lone story's
// description in place of the "Stories" block.
function DocumentationPage() {
  const { csfFile } = useOf('meta', ['meta']);
  const isSingleStory = Object.keys(csfFile.stories).length === 1;

  return createElement(
    Fragment,
    null,
    createElement(Title),
    createElement(Subtitle),
    createElement(Description, { of: 'meta' }),
    isSingleStory ? createElement(Description, { of: 'story' }) : null,
    createElement(Primary),
    createElement(Controls),
    isSingleStory ? null : createElement(Stories),
  );
}

export default {
  tags: ['autodocs'],
  decorators: [
    (story, context) => {
      // Native controls follow `color-scheme`, so switching the theme is
      // setting it on the root.
      document.documentElement.style.colorScheme = context.globals.theme;

      return story();
    },
  ],
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Theme',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  parameters: {
    controls: {
      disableSaveFromUI: true,
    },
    docs: {
      container: ThemedDocumentationContainer,
      page: DocumentationPage,
      // TODO: New with 8.5.0 but not working. Set to `true` and retest with each
      // release.
      codePanel: false,
      canvas: {
        sourceState: 'shown',
      },
      source: {
        format: 'html',
        theme: create({
          base: 'light',
          fontCode: 'monospace',
        }),
        transform(code, context) {
          if (!code) {
            return;
          }

          // "Checkbox Group" → "checkbox-group".
          const component = context.title
            .split('/')
            .at(-1)
            .replaceAll(' ', '-')
            .toLowerCase();

          const $fragment = document.createDocumentFragment();
          const $container = document.createElement('div');

          $fragment.append($container);
          $container.innerHTML = code;

          const $component = $container.querySelector(`slab-${component}`);

          // Now strip out the rest: the elements a story adds only to lay out or
          // style what it shows, such as a wrapper that sets a width. What's
          // inside a component is its content, the markup a consumer writes,
          // such as Toolbar's buttons or a Dialog's form, so it stays without
          // the story's inline styles. A styled `<div>` or `<span>` holding only
          // text is there for its style, so it's reduced to its text.
          for (const $element of $container.querySelectorAll('*')) {
            const isCoreComponent = $element.tagName.startsWith('SLAB');

            let $ancestor = $element.parentElement;

            while ($ancestor && !$ancestor.tagName.startsWith('SLAB')) {
              $ancestor = $ancestor.parentElement;
            }

            const isStylingWrapper =
              $element.hasAttribute('style') &&
              ($element.tagName === 'DIV' || $element.tagName === 'SPAN') &&
              $element.children.length === 0;

            const isContent = Boolean($ancestor) && !isStylingWrapper;

            if (isContent) {
              $element.removeAttribute('style');
            }

            const isFieldComponentElement =
              $element.parentElement?.tagName === 'SLAB-FIELD' &&
              ($element.tagName === 'LABEL' || $element.tagName === 'INPUT');

            const isSlotted = Boolean($element.slot);
            const isScriptTag = $element.tagName === 'SCRIPT';
            const isStyleTag = $element.tagName === 'STYLE';

            if (!isFieldComponentElement) {
              // IDs are only for internal use and so are removed. You'll find comments in
              // the Radio Group story explaining why they're needed.
              $element.removeAttribute('id');
            }

            if (isScriptTag && $element.type === 'ignore') {
              // Scripts with `type="ignore"` exist to show consumers what needs
              // to be imported. `"ignore"` is just a hack to prevent the script
              // from executing and shouldn't show up in the code example.
              $element.removeAttribute('type');
            }

            if (isStyleTag) {
              $element.remove();
            }

            if (
              !isCoreComponent &&
              !isContent &&
              !isSlotted &&
              !isScriptTag &&
              !isFieldComponentElement
            ) {
              if ($element.children.length === 0) {
                // `<div style="margin: 0.625rem;">Panel</div>` → `Panel`
                $element.replaceWith($element.textContent);
              } else {
                // It's possible the element has Slab elements as children. We
                // don't want to remove those. So we unwrap it and continue iterating.
                $element.replaceWith(...$element.childNodes);
              }
            }
          }

          // Only the headless story has a `value` control.
          if (component === 'checkbox-group' && context.args.value) {
            // `toString()` is used instead of `JSON.stringify()` to make the
            // comparison slightly easier to read.
            const isCheckboxGroupValueChanged =
              context.args.value.toString() !==
              context.initialArgs.value.toString();

            if (isCheckboxGroupValueChanged) {
              $component.setAttribute(
                'value',
                JSON.stringify(context.args.value),
              );
            }
          }

          if (component === 'radio-group') {
            for (const $radio of $component.querySelectorAll(
              'slab-radio-group-radio',
            )) {
              $radio.removeAttribute('aria-checked');
              $radio.removeAttribute('aria-disabled');
              $radio.removeAttribute('aria-label');
            }
          }

          if (component === 'breadcrumb') {
            for (const $item of $component.children) {
              $item.removeAttribute('aria-current');
              $item.removeAttribute('slot');
            }
          }

          if (component === 'menu') {
            for (const $anchor of $component.querySelectorAll(
              '[slot="anchor"]',
            )) {
              $anchor.removeAttribute('aria-expanded');
              $anchor.removeAttribute('aria-haspopup');
            }

            for (const $item of $component.querySelectorAll(
              'slab-menu-item',
            )) {
              $item.removeAttribute('aria-disabled');
              $item.removeAttribute('aria-label');
              $item.removeAttribute('role');
            }
          }

          if (component === 'tabs') {
            for (const $tab of $component.querySelectorAll(
              'slab-tabs-tab',
            )) {
              $tab.removeAttribute('aria-controls');
              $tab.removeAttribute('aria-disabled');
              $tab.removeAttribute('aria-selected');
              $tab.removeAttribute('role');
              $tab.removeAttribute('slot');
              $tab.removeAttribute('tabindex');
            }

            for (const $panel of $component.querySelectorAll(
              'slab-tabs-panel',
            )) {
              $panel.removeAttribute('aria-labelledby');
              $panel.removeAttribute('hidden');
              $panel.removeAttribute('role');
              $panel.removeAttribute('tabindex');
            }
          }

          if (component === 'tree') {
            for (const $item of $component.querySelectorAll(
              'slab-tree-item',
            )) {
              $item.removeAttribute('aria-disabled');
              $item.removeAttribute('aria-expanded');
              $item.removeAttribute('aria-label');
              $item.removeAttribute('aria-selected');
              $item.removeAttribute('role');
              $item.removeAttribute('slot');
            }
          }

          if (component === 'toolbar') {
            for (const $control of $component.children) {
              $control.removeAttribute('tabindex');
            }
          }

          // What Toggle Group adds to the buttons, rather than what a consumer
          // writes.
          if (component === 'toggle-group') {
            for (const $button of $component.children) {
              $button.removeAttribute('tabindex');
              $button.removeAttribute('type');

              if ($button.getAttribute('aria-pressed') === 'false') {
                $button.removeAttribute('aria-pressed');
              }
            }
          }

          if (
            component === 'listbox' ||
            component === 'combobox' ||
            component === 'select'
          ) {
            for (const $option of $component.querySelectorAll(
              'slab-option',
            )) {
              $option.removeAttribute('aria-disabled');
              $option.removeAttribute('hidden');
              $option.removeAttribute('aria-label');
              $option.removeAttribute('aria-selected');
              $option.removeAttribute('role');
            }
          }

          // Clean up boolean attributes before returning: `disabled=""` → `disabled`.
          return $container.innerHTML.replaceAll('=""', '');
        },
      },
    },
  },
};
