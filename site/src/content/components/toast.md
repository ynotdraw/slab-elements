---
title: Toast
group: Overlays
element: '[role=status]'
tags: [slab-toast]
summary: 'A polite heads-up that something just happened. It lives on the page up front, so screen readers actually hear it.'
example: |
  <button class="styled-button styled-button--primary" type="button" data-show="toast-example">Save pour</button>

  <slab-styled-toast id="toast-example">Pour saved.</slab-styled-toast>
frameworks:
  react: |
    import 'slab-elements/toast.js';
    import { useRef } from 'react';

    export function MyToast() {
      const toast = useRef(null);

      return (
        <>
          <button onClick={() => toast.current.show()}>Save</button>
          <slab-toast duration={5000} ref={toast}>Changes saved</slab-toast>
        </>
      );
    }
  lit: |
    import 'slab-elements/toast.js';
    import { html, LitElement } from 'lit';
    import { customElement, query } from 'lit/decorators.js';

    @customElement('my-toast')
    export class MyToast extends LitElement {
      @query('slab-toast')
      private toast!: HTMLElementTagNameMap['slab-toast'];

      render() {
        return html`
          <button @click=${() => this.toast.show()}>Save</button>
          <slab-toast duration="5000">Changes saved</slab-toast>
        `;
      }
    }
  vue: |
    <script setup>
    import 'slab-elements/toast.js';
    import { useTemplateRef } from 'vue';

    const toast = useTemplateRef('toast');
    </script>

    <template>
      <button @click="toast.show()">Save</button>
      <slab-toast ref="toast" :duration="5000">Changes saved</slab-toast>
    </template>
  svelte: |
    <script>
      import 'slab-elements/toast.js';

      let toast;
    </script>

    <button onclick={() => toast.show()}>Save</button>
    <slab-toast bind:this={toast} duration={5000}>Changes saved</slab-toast>
usage: |
  <slab-toast duration="5000">Changes saved</slab-toast>

  <script type="module">
    document.querySelector('slab-toast').show();
  </script>
---

## Keyboard

| Key    | What it does                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------- |
| F6     | Moves focus to the open toast shown most recently, and from inside it, back to where focus was. |
| Escape | Dismisses the toast while focus is in it, and moves focus back to where it was.                 |
