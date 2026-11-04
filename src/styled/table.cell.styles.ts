import { css } from 'lit';

export default css`
  :host {
    padding: 0.625rem 0.75rem;
    text-align: start;
    vertical-align: top;
  }

  :host([row-header]) {
    font-weight: 600;
  }
`;
