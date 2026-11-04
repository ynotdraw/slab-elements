import { css } from 'lit';

export default css`
  :host {
    border-block-end: 1px solid var(--ash);
  }

  :host(:last-child) {
    border-block-end: none;
  }
`;
