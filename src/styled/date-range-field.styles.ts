import { css } from 'lit';

export default css`
  [part~='fields'] {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  }

  [part~='field'] {
    display: grid;
    gap: 0.25rem;
  }

  [part~='input-label'] {
    color: var(--ash);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;
