import { satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import type { HastPluginList } from 'satteri';
import { basePathPlugin } from '../base-path';
import { calloutPlugin } from './callouts';
import { figurePlugin } from './figures';
import { headingTrailPlugin } from './headings';
import { mathPlugin } from './math';
import { findStubs, stubLinkPlugin } from './stubs';
import { tablePlugin } from './tables';
import { taskPlugin } from './tasks';

// How normalized markdown is rendered in the house style: the plugins Sätteri runs over every
// page's HTML, in order, after Astro has highlighted the code. The prose styles
// (styles/prose.css) draw what they produce.

export function houseStyle({ base, notesDir }: { base: string; notesDir: string }): HastPluginList {
  return [
    // First, Astro's own plugin gives headings their GitHub-style ids, from their text as the
    // markdown wrote it, before math is typeset or links sprout. Astro runs it again after these
    // plugins, and keeps the ids it finds.
    satteriHeadingIdsPlugin(),
    // Section headings trail their vine, grown from their text before math or links change it.
    headingTrailPlugin,
    calloutPlugin,
    mathPlugin,
    figurePlugin,
    tablePlugin,
    taskPlugin,
    stubLinkPlugin(findStubs(notesDir)),
    // Last, so the plugins before it see the links as the markdown wrote them.
    basePathPlugin(base),
  ];
}
