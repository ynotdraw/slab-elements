import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './editable.js';

const meta: Meta = {
  title: 'Editable',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/editable.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Label',
    'addEventListener(event, handler)': '',
    'cancel()': '',
    'commit()': '',
    disabled: false,
    'edit()': '',
    editing: false,
    'hide-label': false,
    maxlength: '',
    name: '',
    placeholder: '',
    'slot="description"': '',
    value: 'Value',
    version: '',
  },
  argTypes: {
    label: {
      table: { type: { summary: 'string' } },
      type: { name: 'string', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change", handler: (event: Event) => void): void\n\n// "change" is dispatched when an edit is committed with a different value.',
        },
      },
    },
    'cancel()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Stops editing and discards what's typed.
          `,
        },
      },
    },
    'commit()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Stops editing and keeps what's typed.
          `,
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'edit()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): Promise<void>

// Starts editing and focuses the input, with its text selected.
          `,
        },
      },
    },
    editing: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            "// Whether the input is showing rather than the button. Setting it doesn't move focus. `edit()` does.",
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the button and the input for screenreaders.',
        },
      },
    },
    maxlength: {
      table: { type: { summary: 'number' } },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      table: {
        type: {
          summary: 'string',
          detail: "// Shown on the button while it's empty, and in the input.",
        },
      },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// The attribute is the default value. The property is the last committed one.',
        },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: { summary: import.meta.env.VITE_SLAB_VERSION },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-editable
      label=${arguments_.label || nothing}
      maxlength=${arguments_.maxlength || nothing}
      name=${arguments_.name || nothing}
      placeholder=${arguments_.placeholder || nothing}
      value=${arguments_.value || nothing}
      ?disabled=${arguments_.disabled}
      ?editing=${arguments_.editing}
      ?hide-label=${arguments_['hide-label']}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-editable>`;
  },
};

export default meta;

export const Editable: StoryObj = {};

export const Empty: StoryObj = {
  args: {
    placeholder: 'Add a name',
    value: '',
  },
};
