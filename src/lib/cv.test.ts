import { describe, expect, it } from 'vitest';
import { contactList, inlineMarkdown, period } from './cv.ts';

describe('period', () => {
  it('writes a period in words, from month to month or to the present', () => {
    expect(period('2021-09', '2025-06')).toBe('September 2021 – June 2025');
    expect(period('2025-01', 'present')).toBe('January 2025 – present');
    expect(period('2024-12', '2024-12')).toBe('December 2024 – December 2024');
  });
});

describe('contactList', () => {
  it('lists the contacts given in a fixed order, each with its label', () => {
    const contacts = contactList({
      linkedin: 'https://www.linkedin.com/in/example/',
      email: 'jane@example.com',
      github: 'https://github.com/example',
      leetcode: 'https://leetcode.com/example',
    });
    expect(contacts).toEqual([
      { label: 'Email', href: 'mailto:jane@example.com', text: 'jane@example.com' },
      { label: 'GitHub', href: 'https://github.com/example', text: 'github.com/example' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/example/', text: 'linkedin.com/in/example' },
      { label: 'LeetCode', href: 'https://leetcode.com/example', text: 'leetcode.com/example' },
    ]);
  });

  it('lists nothing for no contacts', () => {
    expect(contactList({})).toEqual([]);
  });
});

describe('inlineMarkdown', () => {
  it('renders a line without wrapping it in a paragraph', async () => {
    expect(await inlineMarkdown('**Led** the [release](https://example.com) of *it*', '/')).toBe(
      '<strong>Led</strong> the <a href="https://example.com">release</a> of <em>it</em>',
    );
  });

  it('sets quotes and apostrophes as the page bodies are set', async () => {
    expect(await inlineMarkdown(`the release's "headline"`, '/')).toBe('the release’s “headline”');
  });

  it('puts the base path in front of a site-absolute link', async () => {
    expect(await inlineMarkdown('[a note](/notes/x/)', '/site-preview/')).toBe('<a href="/site-preview/notes/x/">a note</a>');
  });

  it('refuses a line that is not inline', async () => {
    await expect(inlineMarkdown('one\n\ntwo', '/')).rejects.toThrow('must be inline markdown');
    await expect(inlineMarkdown('- a list', '/')).rejects.toThrow('must be inline markdown');
    await expect(inlineMarkdown('# a heading', '/')).rejects.toThrow('must be inline markdown');
  });
});
