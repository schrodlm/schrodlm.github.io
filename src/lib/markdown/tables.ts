import { defineHastPlugin } from 'satteri';
import { h } from './hast';

// A table wider than the column scrolls sideways inside a box of its own, instead of pushing the
// page wider than the screen.

export const tablePlugin = defineHastPlugin({
  name: 'tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, h('div', { className: ['table-scroll'] }));
    },
  },
});
