import katex from 'katex';
import { defineHastPlugin } from 'satteri';
import { elements, hasClass } from './hast';

// Math is typeset with KaTeX while the site builds, so readers get finished HTML and MathML and no
// math script. Sätteri parses `$…$` into <code class="math-inline"> and `$$…$$` into
// <pre><code class="math-display">; each is replaced by KaTeX's rendering. A formula KaTeX can't
// read is shown as its source, marked as an error, rather than failing the build.

function typeset(tex: string, displayMode: boolean) {
  return {
    type: 'raw' as const,
    value: katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor: 'var(--hibiscus-deep)',
      // Letters outside LaTeX's own, such as Czech ones, are welcome, not worth a warning.
      strict: 'ignore',
    }),
  };
}

export const mathPlugin = defineHastPlugin({
  name: 'math',
  element: [
    {
      filter: ['code'],
      visit(node, ctx) {
        return hasClass(node, 'math-inline') ? typeset(ctx.textContent(node), false) : undefined;
      },
    },
    {
      filter: ['pre'],
      visit(node, ctx) {
        const code = elements(node)[0];
        return code && hasClass(code, 'math-display') ? typeset(ctx.textContent(code), true) : undefined;
      },
    },
  ],
});
