import { css } from 'lit';

export default css`
  [part~='inputs'] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  [part~='input'] {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 600;
    inline-size: 3rem;
    padding: 0;
    text-align: center;

    /* The selection would cover the one character, so it's only a caret. */
    &::selection {
      background-color: transparent;
    }
  }

  [part~='filled'] {
    border-block-end-color: var(--ember);
    border-block-end-width: 4px;
  }
`;
