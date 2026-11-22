import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { taskPlugin } from './tasks.ts';

async function render(markdown: string) {
  return (await markdownToHtml(markdown, { hastPlugins: [taskPlugin] })).html.trim();
}

describe('taskPlugin', () => {
  it('draws a done task as [x] and an open one as [ ], keeping the checkbox for screen readers', async () => {
    expect(await render('- [x] Done\n- [ ] Open')).toBe(
      '<ul class="contains-task-list">\n' +
        '<li class="task-list-item"><input type="checkbox" checked disabled class="visually-hidden"><span class="task-box" aria-hidden="true">[x]</span> Done</li>\n' +
        '<li class="task-list-item"><input type="checkbox" disabled class="visually-hidden"><span class="task-box" aria-hidden="true">[ ]</span> Open</li>\n' +
        '</ul>',
    );
  });

  it('leaves an ordinary list alone', async () => {
    expect(await render('- One')).toBe('<ul>\n<li>One</li>\n</ul>');
  });
});
