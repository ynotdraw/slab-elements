import { html, nothing } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './checkbox.js';
import './form.js';
import './switch.js';
import './text-field.js';

const meta: Meta = {
  title: 'Form',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/form.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['reset', 'submit'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': '',
    action: '/',
    'addEventListener(event, handler)': '',
    autocomplete: '',
    'checkValidity()': '',
    elements: '',
    enctype: '',
    form: '',
    label: 'Label',
    method: '',
    name: '',
    novalidate: false,
    'reportValidity()': '',
    'requestSubmit(submitter)': '',
    'reset()': '',
    'submit()': '',
    target: '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'Element | string',
          detail: '// Moved into the form',
        },
      },
    },
    action: {
      table: { type: { summary: 'string' } },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "reset" | "submit", handler: (event: Event) => void): void',
        },
      },
    },
    autocomplete: {
      control: { type: 'select' },
      options: ['', 'on', 'off'],
      table: { type: { summary: '"on" | "off"' } },
    },
    'checkValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    elements: {
      control: false,
      table: {
        type: { summary: 'HTMLFormControlsCollection', detail: '// Readonly' },
      },
    },
    enctype: {
      table: { type: { summary: 'string' } },
    },
    form: {
      control: false,
      table: {
        type: {
          summary: 'HTMLFormElement',
          detail: '// Readonly. The native form, in the light DOM.',
        },
      },
    },
    label: {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the form, which makes it a landmark',
        },
      },
    },
    method: {
      control: { type: 'select' },
      options: ['', 'get', 'post', 'dialog'],
      table: { type: { summary: '"get" | "post" | "dialog"' } },
    },
    name: {
      table: { type: { summary: 'string' } },
    },
    novalidate: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    'requestSubmit(submitter)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(submitter?: HTMLElement | null): void',
        },
      },
    },
    'reset()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    'submit()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    target: {
      table: { type: { summary: 'string' } },
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
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-form
      action=${arguments_.action || nothing}
      autocomplete=${arguments_.autocomplete || nothing}
      enctype=${arguments_.enctype || nothing}
      label=${arguments_.label || nothing}
      method=${arguments_.method || nothing}
      name=${arguments_.name || nothing}
      target=${arguments_.target || nothing}
      ?novalidate=${arguments_.novalidate}
    >
      <slab-text-field label="Name" name="name" required></slab-text-field>
      <slab-checkbox
        label="Subscribe"
        name="subscribe"
        value="yes"
      ></slab-checkbox>
      <slab-switch label="Notifications" name="notifications"></slab-switch>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </slab-form>`;
  },
};

export default meta;

export const Form: StoryObj = {};
