import { describe, expect, test } from 'vitest';
import { firstSentence, plainText, sections } from './devlog';

const DEVLOG = [
  '<p>Before any section.</p>',
  '<h2 id="summary">Summary</h2>',
  '<p>It went well. Then it rained.</p>',
  '<h2 id="done">Done</h2>',
  '<ul><li>One<ul><li>nested, not counted</li></ul></li><li>Two</li></ul>',
  '<blockquote class="callout"><h2 id="inside">Inside a callout</h2><ul><li>not counted</li></ul></blockquote>',
  '<h2 id="next">Next <em>steps</em></h2>',
  '<ol><li>Three</li></ol>',
].join('\n');

describe('a devlog cut into sections', () => {
  const { intro, sections: found } = sections(DEVLOG);

  test('keeps what comes before the first heading', () => {
    expect(intro).toBe('<p>Before any section.</p>');
  });

  test('cuts at each top-level heading, by its id, and not at one inside a callout', () => {
    expect(found.map(({ id }) => id)).toEqual(['summary', 'done', 'next']);
    expect(found[1]!.html).toContain('<h2 id="inside">Inside a callout</h2>');
  });

  test("keeps a heading's own HTML", () => {
    expect(found[2]!.heading).toBe('Next <em>steps</em>');
  });

  test("gives each section everything up to the next heading", () => {
    expect(found[0]!.html).toBe('<p>It went well. Then it rained.</p>');
    expect(found[2]!.html).toBe('<ol><li>Three</li></ol>');
  });

  test('counts the items of its top-level lists only', () => {
    expect(found.map(({ items }) => items)).toEqual([0, 2, 1]);
  });

  test('reads no tags inside a comment or a script', () => {
    const { sections: cut } = sections(
      '<h2 id="a">A</h2><!-- <h2 id="old">Old</h2> --><script>"<h2>"</script><ul><li>1</li></ul><h2 id="b">B</h2>',
    );
    expect(cut.map(({ id, items }) => [id, items])).toEqual([
      ['a', 1],
      ['b', 0],
    ]);
    expect(cut[0]!.html).toContain('<!-- <h2 id="old">Old</h2> -->');
  });

  test('cuts at a heading the markdown trailed, taking its wrapper and trail with it', () => {
    const trailed = (id: string) =>
      `<div class="section-heading"><h2 id="${id}">${id}</h2><span class="trail" aria-hidden="true"><span class="stem">~~</span></span></div>`;
    const { intro, sections: cut } = sections(
      `<p>Lede.</p>${trailed('done')}<ul><li>1</li></ul><div class="other"><h2 id="boxed">Boxed</h2></div>${trailed('next')}<p>Soon.</p>`,
    );
    expect(intro).toBe('<p>Lede.</p>');
    expect(cut.map(({ id, heading }) => [id, heading])).toEqual([
      ['done', 'done'],
      ['next', 'next'],
    ]);
    expect(cut[0]!.html).toBe('<ul><li>1</li></ul><div class="other"><h2 id="boxed">Boxed</h2></div>');
    expect(cut[1]!.html).toBe('<p>Soon.</p>');
  });

  test('is all intro without a heading', () => {
    expect(sections('<p>Just words.</p>')).toEqual({ intro: '<p>Just words.</p>', sections: [] });
  });

  test('reads past a > inside an attribute and past void and self-closing elements', () => {
    const { sections: cut } = sections(
      '<h2 id="a">A</h2><p><img alt="x > y" src="/i.png"><br><svg><path d="M0 0"/></svg></p><ul><li>1</li></ul><h2 id="b">B</h2>',
    );
    expect(cut.map(({ id, items }) => [id, items])).toEqual([
      ['a', 1],
      ['b', 0],
    ]);
  });
});

describe('plain text', () => {
  test('drops tags and reads entities', () => {
    expect(plainText('<strong>Fish</strong> &amp; chips &lt;3 &#x2014; &#8212; &nbsp;done')).toBe('Fish & chips <3 — — done');
  });

  test('reads typeset math as drawn, not twice', () => {
    const math =
      '<span class="katex"><span class="katex-mathml"><math><semantics><mi>x</mi><annotation encoding="application/x-tex">x</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="mord mathnormal">x</span></span></span>';
    expect(plainText(`Let ${math} grow.`)).toBe('Let x grow.');
  });

  test('leaves out the marks of footnotes', () => {
    expect(plainText('A claim<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref>1</a></sup>.')).toBe(
      'A claim.',
    );
  });
});

describe('the first sentence', () => {
  test("is the first sentence of the first paragraph", () => {
    expect(firstSentence('<p>It went well. Then it rained.</p><p>More.</p>', 'en')).toBe('It went well.');
  });

  test('is the whole paragraph when it is one sentence', () => {
    expect(firstSentence('<p>Profiles can now <em>move</em> between computers</p>', 'en')).toBe(
      'Profiles can now move between computers',
    );
  });

  test('ends at a question', () => {
    expect(firstSentence('<p>Would it get me into trouble? Two days went into finding out.</p>', 'en')).toBe(
      'Would it get me into trouble?',
    );
  });

  test('is empty without a paragraph', () => {
    expect(firstSentence('<ul><li>Only a list.</li></ul>', 'en')).toBe('');
  });
});
