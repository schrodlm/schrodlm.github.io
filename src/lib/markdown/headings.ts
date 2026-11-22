import { defineHastPlugin } from 'satteri';
import { trail } from '../trail';
import { h, text } from './hast';

// A section heading of the markdown trails a short vine, as SectionHeading's does: the same markup,
// grown from the heading's text. Only the page's own section headings trail, the <h2>s at the top
// of the text, not one inside a callout or a list.

export const headingTrailPlugin = defineHastPlugin({
  name: 'heading-trails',
  element: {
    filter: ['h2'],
    visit(node, ctx) {
      if (ctx.parent(node).type !== 'root') return;
      const runs = trail(ctx.textContent(node)).map((run) => h('span', { className: [run.part] }, [text(run.text)]));
      ctx.wrapNode(
        node,
        h('div', { className: ['section-heading'] }, [h('span', { className: ['trail'], ariaHidden: 'true' }, runs)]),
      );
    },
  },
});
