import { UPDATE_STORY_ARGS } from '@storybook/core-events';
import { addons } from '@storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import ComboboxComponent from './combobox.js';

const meta: Meta = {
  title: 'Combobox',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/combobox.js';
          import 'slab-elements/option.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'input', 'invalid'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  play(context) {
    const combobox = context.canvasElement.querySelector('slab-combobox');

    if (
      context.name.includes('Error') &&
      combobox instanceof ComboboxComponent
    ) {
      combobox.reportValidity();

      // `reportValidity()` scrolls the element into view, which means the "autodocs"
      // story upon load will be scrolled to the first error story. No good.
      document.documentElement.scrollTop = 0;

      if (document.activeElement instanceof HTMLElement) {
        // Calling `reportValidity()` focuses the element. Focus is expected to be
        // on `document.body` on page load.
        document.activeElement.blur();
      }
    }

    if (combobox instanceof ComboboxComponent) {
      combobox.addEventListener('change', () => {
        addons.getChannel().emit(UPDATE_STORY_ARGS, {
          storyId: context.id,
          updatedArgs: {
            value: combobox.value,
          },
        });
      });
    }

    context.canvasElement
      .querySelector('form')
      ?.addEventListener('submit', (event: Event) => {
        event.preventDefault();

        // We reload the page to give the impression of a submission while keeping
        // the user on the same page.
        window.location.reload();
      });
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`
      <slab-combobox
        label=${arguments_.label || nothing}
        name=${arguments_.name || nothing}
        placeholder=${arguments_.placeholder || nothing}
        placement=${arguments_.placement}
        value=${arguments_.value || nothing}
        ?allow-custom=${arguments_['allow-custom']}
        ?disabled=${arguments_.disabled}
        ?hide-label=${arguments_['hide-label'] || nothing}
        ?multiple=${arguments_.multiple}
        ?required=${arguments_.required}
      >
        <slab-option
          label=${arguments_['<slab-option>.label'] || nothing}
          value=${arguments_['<slab-option>.value'] || nothing}
          ?disabled=${arguments_['<slab-option>.disabled']}
          ?selected=${arguments_['<slab-option>.selected']}
        >
          Apple
        </slab-option>

        <slab-option value="banana">Banana</slab-option>
        <slab-option value="cherry">Cherry</slab-option>
        <slab-option value="grape">Grape</slab-option>

        ${
          arguments_['slot="description"']
            ? html`<div slot="description">
                ${unsafeHTML(arguments_['slot="description"'])}
              </div>`
            : nothing
        }
      </slab-combobox>
    `;
  },
  args: {
    label: 'Label',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    'allow-custom': false,
    'checkValidity()': '',
    disabled: false,
    filter: '',
    'hide-label': false,
    multiple: false,
    name: '',
    placeholder: '',
    placement: 'bottom',
    removeLabel: '',
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
    value: '',
    version: '',
    '<slab-option>.disabled': false,
    '<slab-option>.label': '',
    '<slab-option>.selected': false,
    '<slab-option>.value': 'apple',
    '<slab-option>.version': '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: { summary: 'Option' },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input" | "invalid", handler: (event: Event) => void): void',
        },
      },
    },
    'allow-custom': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Lets the value be text that matches no Option.',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): boolean',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    filter: {
      control: false,
      table: {
        defaultValue: {
          summary: '// A case-insensitive substring of its text',
        },
        type: {
          summary: 'property',
          detail: '(option: Option, query: string) => boolean',
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Hidden visually. It still names the Combobox.',
        },
      },
    },
    multiple: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Each selected Option is shown as a tag that removes it.',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      table: {
        type: { summary: 'string' },
      },
    },
    placement: {
      control: { type: 'radio' },
      options: ['bottom', 'top'],
      table: {
        defaultValue: { summary: '"bottom"' },
        type: {
          summary: '"bottom" | "top"',
          detail: "// It flips when there isn't room.",
        },
      },
    },
    removeLabel: {
      control: false,
      table: {
        defaultValue: { summary: '(text) => `Remove ${text}`' },
        type: {
          summary: '(text: string) => string',
          detail:
            "// Names each tag's button, which shows only the selected Option's text, from that text.",
        },
      },
    },
    'reportValidity()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): boolean',
        },
      },
    },
    required: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'resetValidityFeedback()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Clears the validity feedback while leaving \`validity\` as it is.
          `,
        },
      },
    },
    'setCustomValidity(message)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(message: string): void',
        },
      },
    },
    'setValidity(flags, message)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(flags?: ValidityStateFlags, message?: string): void',
        },
      },
    },
    'slot="description"': {
      table: {
        type: { summary: 'Element' },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            "// The selected Option's value, or the typed text when `allow-custom` is set. `values` has every one of them when `multiple` is set.",
        },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: {
          summary: import.meta.env.VITE_SLAB_VERSION,
        },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
    '<slab-option>.disabled': {
      name: 'disabled',
      table: {
        category: 'Option',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    '<slab-option>.label': {
      name: 'label',
      table: {
        category: 'Option',
        type: {
          summary: 'string',
          detail: '// Names the Option in place of its text.',
        },
      },
    },
    '<slab-option>.selected': {
      name: 'selected',
      table: {
        category: 'Option',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    '<slab-option>.value': {
      name: 'value',
      table: {
        category: 'Option',
        defaultValue: { summary: '// Its label, or else its text' },
        type: { summary: 'string' },
      },
    },
    '<slab-option>.version': {
      name: 'version',
      control: false,
      table: {
        category: 'Option',
        defaultValue: {
          summary: import.meta.env.VITE_SLAB_VERSION,
        },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
};

export default meta;

export const Combobox: StoryObj = {
  tags: ['!autodocs'],
};

export const AllowCustom: StoryObj = {
  args: {
    'allow-custom': true,
  },
};

export const Multiple: StoryObj = {
  args: {
    multiple: true,
  },
};

export const WithError: StoryObj = {
  args: {
    required: true,
  },
};
