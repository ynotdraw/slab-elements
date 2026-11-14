import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './search-field.js';

const meta: Meta = {
  title: 'Search Field',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/search-field.js';
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
    'clear-label': '',
    disabled: false,
    'hide-label': false,
    maxlength: '',
    minlength: '',
    name: '',
    pattern: '',
    placeholder: '',
    readonly: false,
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'select()': '',
    'setCustomValidity(message)': '',
    'setSelectionRange(start, end, direction)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
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
    'clear-label': {
      table: {
        defaultValue: { summary: '"Clear search"' },
        type: {
          summary: 'string',
          detail: "// The clear button's text and so its accessible name.",
        },
      },
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
    maxlength: {
      table: { type: { summary: 'number' } },
    },
    minlength: {
      table: {
        type: {
          summary: 'number',
          detail:
            '// Like a native input, only a value the user has typed can be too short.',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    pattern: {
      table: { type: { summary: 'string' } },
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
    'setSelectionRange(start, end, direction)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(start: number, end: number, direction?: "forward" | "backward" | "none"): void',
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
      table: { type: { summary: 'Element | string' } },
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
    return html`<slab-search-field
      autocomplete=${arguments_.autocomplete || nothing}
      clear-label=${arguments_['clear-label'] || nothing}
      label=${arguments_.label || nothing}
      maxlength=${arguments_.maxlength || nothing}
      minlength=${arguments_.minlength || nothing}
      name=${arguments_.name || nothing}
      pattern=${arguments_.pattern || nothing}
      placeholder=${arguments_.placeholder || nothing}
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
    </slab-search-field>`;
  },
};

export default meta;

export const SearchField: StoryObj = {};

export const WithValue: StoryObj = {
  args: {
    value: 'Concrete',
  },
};

export const WithError: StoryObj = {
  args: {
    required: true,
  },
};
