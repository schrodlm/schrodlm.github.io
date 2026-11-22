import { defineHastPlugin } from 'satteri';
import { elements, h, text } from './hast';

// An image standing alone in its paragraph becomes a figure, which the prose styles centre in a
// thin frame. Real alt text is also shown as a small caption beneath it, hidden from screen readers,
// which read the alt text already. Normalized markdown gives an image without alt text the alt
// `Image`, which is no caption. An image inside a line of text is left in the line.

const NO_CAPTION = new Set(['', 'Image']);

export const figurePlugin = defineHastPlugin({
  name: 'figures',
  element: {
    filter: ['p'],
    visit(node) {
      const image = elements(node)[0];
      const alone = node.children.every((child) => child === image || (child.type === 'text' && child.value.trim() === ''));
      if (image?.tagName !== 'img' || !alone) return;
      const alt = String(image.properties['alt'] ?? '').trim();
      const caption = NO_CAPTION.has(alt) ? [] : [h('figcaption', { ariaHidden: 'true' }, [text(alt)])];
      return h('figure', { className: ['figure'] }, [image, ...caption]);
    },
  },
});
