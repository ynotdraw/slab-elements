import path from 'node:path';
import { Project } from 'ts-morph';
import manifest from '../../custom-elements.json' with { type: 'json' };
import getAttributeTags from './get-attribute-tags.js';
import getCssPartTags from './get-css-part-tags.js';
import getCssPropertyTags from './get-css-property-tags.js';
import getCssStateTags from './get-css-state-tags.js';
import getPropertyTags from './get-property-tags.js';
import getSlotTags from './get-slot-tags.js';
import getEventTags from './get-event-tags.js';
import getMethodTags from './get-method-tags.js';

/**
 * Uses the information in the elements manifest to add a top-level JSDoc
 * comment to every component.
 */
const project = new Project();

project.addSourceFilesAtPaths([
  './src/*.ts',
  './src/*.*.ts',
  './src/headless/*.ts',
  '!**/*stories*',
  '!**/*styles*',
  '!**/*test*',
]);

let isSave = false;

for (const file of project.getSourceFiles()) {
  const module = manifest.modules.find((module) => {
    return module.path === path.relative(process.cwd(), file.getFilePath());
  });

  for (const node of file.getClasses()) {
    // Any class the manifest has as a custom element, rather than only classes
    // that extend `LitElement` directly. Styled components extend headless ones,
    // and the manifest includes what they inherit.
    //
    // Matched by module as well as by class name because class names aren't
    // unique. Headless Select and the existing Select, for example, were both
    // "Select".
    const declaration = module?.declarations?.find((declaration) => {
      return declaration.customElement && declaration.name === node.getName();
    });

    if (!declaration) {
      continue;
    }

    const tags = [
      // Attributes at the top because some are required and everyone uses them.
      // Then slots for the same reason.
      //
      // Parts, custom properties and states are rare and could get lost in the
      // noise. So they're next. Then events because they're commonly used but
      // optional. Then the rest.
      ...getAttributeTags(declaration),
      ...getSlotTags(declaration),
      ...getCssPartTags(declaration),
      ...getCssPropertyTags(declaration),
      ...getCssStateTags(declaration),
      ...getEventTags(declaration),
      ...getPropertyTags(declaration),
      ...getMethodTags(declaration),
    ];

    const documentation = node.getJsDocs().at(0);
    const currentComment = documentation?.getText();

    // Only the tags are generated. Prose above them is written by hand and kept,
    // for what the tags can't say, like how a component's states fit together.
    const description = documentation?.getDescription().trim();

    node.set({
      docs:
        tags.length > 0 || description
          ? [
              {
                description,
                tags,
              },
            ]
          : [],
    });

    const newComment = node.getJsDocs().at(0)?.getText();

    if (currentComment !== newComment) {
      isSave = true;
    }
  }
}

// Conditionlly saving lets us watch `./custom-elements.json` in
// `start:development:ts-morph` without a loop.
//
// Otherwise, a change to a component would trigger a write to
// `./custom-elements.json` via `start:development:cem-analyze`.
//
// Then `start:development:ts-morph` would run and write the component's
// file again, which would cause `start:development:cem-analyze` to run
// again.
if (isSave) {
  await project.save();
}
