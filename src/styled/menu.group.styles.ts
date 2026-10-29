import { css } from 'lit';

export default css`
  :host {
    border-block-start: var(--border);
  }

  [part~='label'] {
    color: var(--ash);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 0.5rem 0.875rem 0.25rem 1rem;
    text-transform: uppercase;
  }
`;
