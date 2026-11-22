// What the CV page makes of the CV note's front matter: its periods in words, its contacts as
// links, and its lines of inline markdown as HTML.
import { markdownToHtml } from 'satteri';
import { basePathPlugin } from './base-path';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A month written YYYY-MM, in words: `2025-01` is January 2025. */
function monthInWords(month: string): string {
  const [year, number] = month.split('-');
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

/** A period from its start to its end, a month or `present`: January 2025 – present. */
export function period(start: string, end: string): string {
  return `${monthInWords(start)} – ${end === 'present' ? 'present' : monthInWords(end)}`;
}

export interface Contacts {
  email?: string | undefined;
  web?: string | undefined;
  github?: string | undefined;
  linkedin?: string | undefined;
}

export interface Contact {
  label: string;
  href: string;
  /** The address as it is read and printed: without its scheme, `www.` or a closing slash. */
  text: string;
}

const LABELS = { email: 'Email', web: 'Web', github: 'GitHub', linkedin: 'LinkedIn' } as const;

/** The contacts given, in a fixed order, each with its label. */
export function contactList(contacts: Contacts): Contact[] {
  return (Object.keys(LABELS) as (keyof typeof LABELS)[]).flatMap((key): Contact[] => {
    const value = contacts[key];
    if (!value) return [];
    if (key === 'email') return [{ label: LABELS[key], href: `mailto:${value}`, text: value }];
    const text = value.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    return [{ label: LABELS[key], href: value, text }];
  });
}

/**
 * A line of the CV, written in inline markdown, as HTML, rendered as the site renders a page's
 * body: smart punctuation, and the base path in front of site-absolute links. A line that makes
 * more than one paragraph, or a list or heading, isn't inline and fails the build.
 */
export async function inlineMarkdown(line: string, base: string): Promise<string> {
  const { html } = await markdownToHtml(line, {
    hastPlugins: [basePathPlugin(base)],
    features: { smartPunctuation: true },
  });
  const inner = html.trim().match(/^<p>([\s\S]*)<\/p>$/)?.[1];
  if (inner === undefined || inner.includes('<p>')) {
    throw new Error(
      `A line of the CV must be inline markdown, but this one isn't: ${line}\n` +
        'A line that starts like a list or a heading, such as "2024. …" or "- …", needs that escaped: "2024\\. …".',
    );
  }
  return inner;
}
