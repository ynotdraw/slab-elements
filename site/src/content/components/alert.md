---
title: Alert
group: Overlays
element: '[role=alert]'
tags: [slab-alert]
summary: "An inline message that gets announced when it shows up. Put it on the page empty, then fill it in when there's something to say."
example: |
  <button class="styled-button" type="button" data-announce="alert-example" data-message="Error: the slab's surface dropped below 40 °F. Cover it tonight.">
    Simulate a cold snap
  </button>

  <slab-styled-alert id="alert-example" dismissible></slab-styled-alert>
frameworks:
  react: |
    import 'slab-elements/alert.js';

    // Empty until there's a message, so it's announced when it arrives.
    export function MyAlert({ message }) {
      return <slab-alert dismissible>{message}</slab-alert>;
    }
  lit: |
    import 'slab-elements/alert.js';
    import { html, LitElement } from 'lit';
    import { customElement, property } from 'lit/decorators.js';

    @customElement('my-alert')
    export class MyAlert extends LitElement {
      // Empty until there's a message, so it's announced when it arrives.
      @property()
      message = '';

      render() {
        return html`<slab-alert dismissible>${this.message}</slab-alert>`;
      }
    }
  vue: |
    <script setup>
    import 'slab-elements/alert.js';

    // Empty until there's a message, so it's announced when it arrives.
    defineProps(['message']);
    </script>

    <template>
      <slab-alert dismissible>{{ message }}</slab-alert>
    </template>
  svelte: |
    <script>
      import 'slab-elements/alert.js';

      // Empty until there's a message, so it's announced when it arrives.
      let { message = '' } = $props();
    </script>

    <slab-alert dismissible>{message}</slab-alert>
usage: |
  <slab-alert dismissible></slab-alert>

  <script type="module">
    document.querySelector('slab-alert').textContent =
      'Error: the file is too large';
  </script>
---
