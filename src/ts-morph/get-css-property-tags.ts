import { type JSDocTagStructure, type OptionalKind } from 'ts-morph';
import manifest from '../../custom-elements.json' with { type: 'json' };

export default (
  declaration: (typeof manifest)['modules'][number]['declarations'][number],
) => {
  const tags: OptionalKind<JSDocTagStructure>[] = [];
  const isCssProperties = 'cssProperties' in declaration;

  if (!isCssProperties) {
    return tags;
  }

  // Typed rather than inferred from the manifest. No component declares a
  // custom property today, because Slab ships no visual styles, so the
  // manifest's type for this field collapses to `unknown`. The plugin that
  // fills it in is still in place for whenever one does.
  const properties = [
    ...(declaration.cssProperties as {
      name: string;
      default?: string;
      description?: string;
    }[]),
  ].toSorted((a, b) => {
    return a.name < b.name ? -1 : 1;
  });

  for (const [index, property] of properties.entries()) {
    tags.push({
      tagName: 'cssprop',
      leadingTrivia(writer) {
        writer.conditionalNewLine(index === 0);
      },
      text(writer) {
        writer.write(`[${property.name}=${property.default}]`);

        if ('description' in property && property.description) {
          // Multi-line comments are hard to read unless we indent them. Figured
          // doing so isn't worthwhile given the complexity of indenting them
          // correctly. So we simply reduce the comment to a single line.
          writer.write(` - ${property.description.replaceAll('\n', ' ')}`);
        }
      },
    });
  }

  return tags;
};
