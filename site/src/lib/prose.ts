// The JSDoc and the manifest's descriptions are plain text with `code` spans
// and nothing else, so they're rendered here rather than with a Markdown
// library: escaped, with each span made a <code>.

const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** One line of text, with its `code` spans as <code>. */
export function inline(text = ''): string {
  return escape(text.replaceAll(/\s*\n\s*/g, ' ')).replaceAll(
    /`([^`]+)`/g,
    '<code>$1</code>',
  );
}

/** One line of text, with its `code` spans and its [links](https://…). */
export function linked(text = ''): string {
  return inline(text).replaceAll(
    /\[([^\]]+)\]\((https:[^)\s]+)\)/g,
    '<a href="$2">$1</a>',
  );
}

/** Paragraphs separated by blank lines, each a <p>. */
export function paragraphs(text = ''): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${inline(paragraph)}</p>`)
    .join('\n');
}

/** A Markdown table cell: one line, with pipes escaped. */
export function cell(text = ''): string {
  return text.replaceAll(/\s*\n\s*/g, ' ').replaceAll('|', '\\|');
}
