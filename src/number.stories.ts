import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './number.js';

const meta: Meta = {
  title: 'Number',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/number.js';
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
  args: {
    label: 'Label',
    'addEventListener(event, handler)': '',
    autocomplete: '',
    'checkValidity()': '',
    disabled: false,
    'hide-label': false,
    max: '',
    min: '',
    name: '',
    placeholder: '',
    readonly: false,
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'select()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
    step: '',
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
            '(event: "change" | "input" | "invalid", handler: (event: Event) => void): void',
        },
      },
    },
    autocomplete: {
      table: { type: { summary: 'string' } },
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
            '// Hides the label visually. It still names the input for screenreaders.',
        },
      },
    },
    max: {
      table: { type: { summary: 'number' } },
    },
    min: {
      table: { type: { summary: 'number' } },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      table: { type: { summary: 'string' } },
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
    'select()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
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
    step: {
      table: {
        type: {
          summary: 'number | "any"',
          detail: "// Left unset, the input's own default of 1 applies.",
        },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// A string, as on the input. The attribute is the default value. The property is the current one.',
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
    return html`<slab-number
      autocomplete=${arguments_.autocomplete || nothing}
      label=${arguments_.label || nothing}
      max=${arguments_.max || nothing}
      min=${arguments_.min || nothing}
      name=${arguments_.name || nothing}
      placeholder=${arguments_.placeholder || nothing}
      step=${arguments_.step || nothing}
      value=${arguments_.value || nothing}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
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
    </slab-number>`;
  },
};

export default meta;

export const NumberField: StoryObj = {};

export const WithError: StoryObj = {
  args: {
    required: true,
  },
};
