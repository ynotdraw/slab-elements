import { type JSDocTagStructure, type OptionalKind } from 'ts-morph';
import manifest from '../../custom-elements.json' with { type: 'json' };

export default (
  declaration: (typeof manifest)['modules'][number]['declarations'][number],
) => {
  const tags: OptionalKind<JSDocTagStructure>[] = [];

  // The parts are typed here rather than taken from the manifest's own type.
  // Nothing in the manifest has a part until a component has one, so the type
  // inferred from the JSON has no `cssParts` to infer from, and this wouldn't
  // compile until the first part existed.
  const cssParts = ('cssParts' in declaration ? declaration.cssParts : []) as {
    name: string;
    description?: string;
  }[];

  const parts = [...cssParts].toSorted((a, b) => {
    return a.name < b.name ? -1 : 1;
  });

  for (const [index, part] of parts.entries()) {
    tags.push({
      tagName: 'csspart',
      leadingTrivia(writer) {
        writer.conditionalNewLine(index === 0);
      },
      text(writer) {
        writer.write(part.name);

        if ('description' in part && part.description) {
          // Multi-line comments are hard to read unless we indent them. Figured
          // doing so isn't worthwhile given the complexity of indenting them
          // correctly. So we simply reduce the comment to a single line.
          writer.write(` - ${part.description.replaceAll('\n', ' ')}`);
        }
      },
    });
  }

  return tags;
};
