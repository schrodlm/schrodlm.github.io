import { defineHastPlugin } from 'satteri';
import { h, text } from './hast';

// A task's checkbox is drawn in text, `[x]` or `[ ]`. The real checkbox stays for screen readers,
// which announce it as checked or not, and is hidden from sight.

export const taskPlugin = defineHastPlugin({
  name: 'tasks',
  element: {
    filter: ['input'],
    visit(node, ctx) {
      if (node.properties['type'] !== 'checkbox') return;
      const done = node.properties['checked'] === true;
      ctx.setProperty(node, 'className', ['visually-hidden']);
      ctx.insertAfter(node, h('span', { className: ['task-box'], ariaHidden: 'true' }, [text(done ? '[x]' : '[ ]')]));
    },
  },
});
