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

    /*
      The selection would cover the one character, so it's only a caret. The
      color is the input's own because Chrome otherwise inherits the page's
      selection color, which can match the input's background and hide the
      character in the last input, which stays selected as it's typed into.
    */
    &::selection {
      background-color: transparent;
      color: currentcolor;
    }
  }

  [part~='filled'] {
    border-block-end-color: var(--ember);
    border-block-end-width: 4px;
  }
`;
