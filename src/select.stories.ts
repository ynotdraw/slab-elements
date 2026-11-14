import { UPDATE_STORY_ARGS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import SelectComponent from './select.js';

const meta: Meta = {
  title: 'Select',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/select.js';
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
    const select = context.canvasElement.querySelector('slab-select');

    if (context.name.includes('Error') && select instanceof SelectComponent) {
      select.reportValidity();

      // `reportValidity()` scrolls the element into view, which means the "autodocs"
      // story upon load will be scrolled to the first error story. No good.
      document.documentElement.scrollTop = 0;

      if (document.activeElement instanceof HTMLElement) {
        // Calling `reportValidity()` focuses the element. Focus is expected to be
        // on `document.body` on page load.
        document.activeElement.blur();
      }
    }

    if (select instanceof SelectComponent) {
      select.addEventListener('change', () => {
        addons.getChannel().emit(UPDATE_STORY_ARGS, {
          storyId: context.id,
          updatedArgs: {
            value: select.value,
            '<slab-option>.one.selected': select.values.includes('one'),
            '<slab-option>.two.selected': select.values.includes('two'),
            '<slab-option>.three.selected': select.values.includes('three'),
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
      <slab-select
        label=${arguments_.label || nothing}
        name=${arguments_.name || nothing}
        placeholder=${arguments_.placeholder || nothing}
        placement=${arguments_.placement}
        value=${arguments_.value || nothing}
        ?disabled=${arguments_.disabled}
        ?hide-label=${arguments_['hide-label'] || nothing}
        ?multiple=${arguments_.multiple}
        ?open=${arguments_.open}
        ?required=${arguments_.required}
      >
        <slab-option
          label=${arguments_['<slab-option>.label'] || nothing}
          value=${arguments_['<slab-option>.value'] || nothing}
          ?disabled=${arguments_['<slab-option>.one.disabled']}
          ?selected=${arguments_['<slab-option>.one.selected']}
        >
          One
        </slab-option>

        <slab-option
          value="two"
          ?selected=${arguments_['<slab-option>.two.selected']}
        >
          Two
        </slab-option>

        <slab-option
          value="three"
          ?selected=${arguments_['<slab-option>.three.selected']}
        >
          Three
        </slab-option>

        ${
          arguments_['slot="description"']
            ? html`<div slot="description">
                ${unsafeHTML(arguments_['slot="description"'])}
              </div>`
            : nothing
        }
      </slab-select>
    `;
  },
  args: {
    label: 'Label',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    'checkValidity()': '',
    disabled: false,
    'hide()': '',
    'hide-label': false,
    multiple: false,
    name: '',
    open: false,
    placeholder: 'Choose one',
    placement: 'bottom',
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'show()': '',
    'slot="description"': '',
    value: '',
    version: '',
    '<slab-option>.label': '',
    '<slab-option>.one.disabled': false,
    '<slab-option>.one.selected': false,
    '<slab-option>.value': 'one',
    '<slab-option>.version': '',
    '<slab-option>.two.selected': false,
    '<slab-option>.three.selected': false,
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
    'hide()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): void',
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Hidden visually. It still names the Select.',
        },
      },
    },
    multiple: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    placeholder: {
      table: {
        type: {
          summary: 'string',
          detail: '// Shown in place of a value when no Option is selected.',
        },
      },
    },
    placement: {
      control: { type: 'select' },
      options: ['bottom', 'left', 'right', 'top'],
      table: {
        defaultValue: { summary: '"bottom"' },
        type: {
          summary: '"bottom" | "left" | "right" | "top"',
          detail:
            "// The side of the combobox it opens on, when there's room. It flips when there isn't.",
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
    'show()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): void',
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
            '// The first selected and enabled Option. `values` has every one of them.',
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
    '<slab-option>.one.disabled': {
      name: 'disabled',
      table: {
        category: 'Option',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    '<slab-option>.one.selected': {
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
    '<slab-option>.two.selected': {
      table: {
        disable: true,
      },
    },
    '<slab-option>.three.selected': {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;

export const Select: StoryObj = {
  tags: ['!autodocs'],
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
