import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './pin-input.js';

const meta: Meta = {
  title: 'Pin Input',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/pin-input.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'complete', 'input', 'invalid'],
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
    autocomplete: '',
    'checkValidity()': '',
    disabled: false,
    'hide-label': false,
    inputLabel: '',
    length: '',
    mask: false,
    name: '',
    placeholder: '',
    readonly: false,
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
    type: 'numeric',
    value: '',
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
            '(event: "change" | "complete" | "input" | "invalid", handler: (event: Event) => void): void',
        },
      },
    },
    autocomplete: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Set on the first input. "one-time-code" for a code sent by text or email.',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the inputs for screenreaders.',
        },
      },
    },
    inputLabel: {
      control: false,
      table: {
        defaultValue: {
          summary: '(position, length) => `Character ${position} of ${length}`',
        },
        type: {
          summary: '(position: number, length: number) => string',
          detail: '// Names each input from its position, starting at 1.',
        },
      },
    },
    length: {
      table: {
        defaultValue: { summary: '6' },
        type: {
          summary: 'number',
          detail: '// How many characters, and so how many inputs.',
        },
      },
    },
    mask: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            "// Hides each character as it's typed, as a password input does.",
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
        type: { summary: 'string', detail: '// Shown in each empty input.' },
      },
    },
    readonly: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Unlike `disabled`, a readonly field is still focusable and still submitted.',
        },
      },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
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

// Clears the validity feedback without changing \`validity\`.
          `,
        },
      },
    },
    'setCustomValidity(message)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(message: string): void' },
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
      table: { type: { summary: 'Element | string' } },
    },
    type: {
      control: { type: 'select' },
      options: ['numeric', 'alphanumeric'],
      table: {
        defaultValue: { summary: '"numeric"' },
        type: {
          summary: '"numeric" | "alphanumeric"',
          detail:
            '// "numeric" accepts digits and brings up a number pad. "alphanumeric" accepts letters and digits.',
        },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// The attribute is the default value. The property is the current one.',
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
    return html`<slab-pin-input
      autocomplete=${arguments_.autocomplete || nothing}
      label=${arguments_.label || nothing}
      length=${arguments_.length > 0 ? arguments_.length : nothing}
      name=${arguments_.name || nothing}
      placeholder=${arguments_.placeholder || nothing}
      type=${arguments_.type || nothing}
      value=${arguments_.value || nothing}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
      ?mask=${arguments_.mask}
      ?readonly=${arguments_.readonly}
      ?required=${arguments_.required}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-pin-input>`;
  },
};

export default meta;

export const PinInput: StoryObj = {};

export const WithError: StoryObj = {
  args: {
    required: true,
  },
};
